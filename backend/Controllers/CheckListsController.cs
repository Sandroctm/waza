using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sigecosem.WebApi.Data;
using Sigecosem.WebApi.Models;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;

namespace Sigecosem.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CheckListsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CheckListsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : null;
        }

        private void Audit(string action, string details)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var audit = new AuditoriaLog
            {
                UsuarioId = GetCurrentUserId() ?? 1,
                Accion = action,
                Modulo = "CheckList Digital",
                Detalles = details,
                IP = ip,
                Computadora = Request.Headers["User-Agent"].ToString().Length > 100 
                              ? Request.Headers["User-Agent"].ToString()[..100] 
                              : Request.Headers["User-Agent"].ToString()
            };
            _context.AuditoriaLogs.Add(audit);
            _context.SaveChanges();
        }

        [HttpGet]
        public IActionResult Get()
        {
            var checklists = _context.CheckLists
                .Include(c => c.Equipo)
                .Include(c => c.Operador)
                .Include(c => c.Supervisor)
                .OrderByDescending(c => c.FechaHora)
                .ToList();
            return Ok(checklists);
        }

        [HttpGet("semana/{anio}/{semana}")]
        public IActionResult GetBySemana(int anio, int semana)
        {
            var checklists = _context.CheckLists
                .Include(c => c.Equipo)
                .Include(c => c.Operador)
                .Include(c => c.Supervisor)
                .Where(c => c.Anio == anio && c.Semana == semana)
                .OrderByDescending(c => c.FechaHora)
                .ToList();
            return Ok(checklists);
        }

        [HttpPost]
        public IActionResult Create([FromBody] CheckList checklist)
        {
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa.ToUpper() == checklist.EquipoPlaca.ToUpper());
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            // Automatically inherit relations from the equipment to prevent DB validation issues
            checklist.ProyectoId = equipo.ProyectoId;
            checklist.AreaId = equipo.AreaId;
            
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                checklist.OperadorId = userId.Value;
            }
            else if (checklist.OperadorId == 0)
            {
                checklist.OperadorId = equipo.OperadorId ?? _context.Usuarios.FirstOrDefault()?.Id ?? 1;
            }

            // Set calendar fields
            checklist.FechaHora = DateTime.UtcNow;

            // Validate consecutive meters
            var lastChecklist = _context.CheckLists
                .Where(c => c.EquipoPlaca.ToUpper() == checklist.EquipoPlaca.ToUpper())
                .OrderByDescending(c => c.FechaHora)
                .FirstOrDefault();

            if (lastChecklist != null)
            {
                if (checklist.HorometroInicial.HasValue && lastChecklist.HorometroFinal.HasValue && checklist.HorometroInicial != lastChecklist.HorometroFinal)
                {
                    return BadRequest(new { message = $"El horómetro inicial debe ser exactamente igual al último horómetro final registrado ({lastChecklist.HorometroFinal} hrs)." });
                }
                if (checklist.KilometrajeInicial.HasValue && lastChecklist.KilometrajeFinal.HasValue && checklist.KilometrajeInicial != lastChecklist.KilometrajeFinal)
                {
                    return BadRequest(new { message = $"El kilometraje inicial debe ser exactamente igual al último kilometraje final registrado ({lastChecklist.KilometrajeFinal} km)." });
                }
            }

            
            // Calculate ISO Week
            var d = DateTime.UtcNow;
            int day = (int)System.Globalization.CultureInfo.CurrentCulture.Calendar.GetDayOfWeek(d);
            var isoWeek = System.Globalization.CultureInfo.CurrentCulture.Calendar.GetWeekOfYear(d.AddDays(4 - (day == 0 ? 7 : day)), System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
            
            checklist.Semana = isoWeek;
            checklist.Mes = d.Month;
            checklist.Anio = d.Year;

            // Handle critical logic
            if (checklist.TieneFallasCriticas)
            {
                checklist.Estado = "Rechazado";
                equipo.Estado = "Bloqueado por SSOMA";

                // Generate automatic alert
                _context.Alertas.Add(new Alerta
                {
                    EquipoPlaca = checklist.EquipoPlaca,
                    Tipo = "FallaCritica",
                    Mensaje = $"Checklist fallido por operador: {checklist.Observaciones}. Equipo bloqueado automáticamente por SSOMA.",
                    FechaCreacion = DateTime.UtcNow,
                    Resuelta = false
                });
            }
            else
            {
                checklist.Estado = "Aprobado";
                // If it was blocked, and checklist is clean, do we release it? 
                // The prompt says: "liberado por un usuario autorizado". So it doesn't auto-release unless explicitly done.
                if (equipo.Estado == "Disponible" || equipo.Estado == "Bloqueado por SSOMA")
                {
                    // If it was just "Disponible", keep it operational.
                    if (equipo.Estado != "Bloqueado por SSOMA")
                    {
                        equipo.Estado = "Operativo";
                    }
                }
            }

            _context.CheckLists.Add(checklist);
            _context.SaveChanges();

            // Store in Excel database replica
            try
            {
                var condName = _context.Conductores.FirstOrDefault(c => c.Id == checklist.ConductorId);
                string conductorStr = condName != null ? $"{condName.Nombre} {condName.Apellido}" : "Sistema/Operador";
                Sigecosem.WebApi.Helpers.ExcelDbHelper.AppendCheckList(
                    checklist.EquipoPlaca,
                    conductorStr,
                    checklist.Servicio,
                    checklist.KilometrajeInicial,
                    checklist.KilometrajeFinal,
                    checklist.HorometroInicial,
                    checklist.HorometroFinal,
                    checklist.CombustibleNivel,
                    checklist.Estado,
                    checklist.Observaciones
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed to append checklist to excel: " + ex.Message);
            }

            Audit("Registrar Checklist", $"Checklist ingresado Placa: {checklist.EquipoPlaca}, Falla Crítica: {checklist.TieneFallasCriticas}, Estado Equipo: {equipo.Estado}");

            return Ok(new { message = "Checklist guardado exitosamente.", checklist, equipoEstado = equipo.Estado });
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var checklist = _context.CheckLists.FirstOrDefault(c => c.Id == id);
            if (checklist == null) return NotFound(new { message = "Checklist no encontrado" });

            _context.CheckLists.Remove(checklist);
            _context.SaveChanges();

            Audit("Eliminar Checklist", $"Checklist eliminado ID: {id}, Placa: {checklist.EquipoPlaca}");

            return Ok(new { message = "Checklist eliminado exitosamente." });
        }

        [HttpGet("exportar-excel")]
        [AllowAnonymous]
        public async Task<IActionResult> ExportarExcel([FromQuery] string? equipoPlaca)
        {
            var query = _context.CheckLists
                .Include(c => c.Equipo)
                .Include(c => c.Conductor)
                .AsQueryable();

            if (!string.IsNullOrEmpty(equipoPlaca))
            {
                query = query.Where(c => c.EquipoPlaca.ToUpper() == equipoPlaca.ToUpper());
            }

            var checklists = await query.OrderByDescending(c => c.FechaHora).ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("CheckList Digital");

            worksheet.Cell("A1").Value = "REPORTE DE CHECKLIST PRE-OPERACIONAL";
            worksheet.Range("A1:K1").Merge().Style.Font.Bold = true;
            worksheet.Range("A1:K1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            worksheet.Range("A1:K1").Style.Font.FontSize = 14;

            string[] headers = { "ID", "FECHA Y HORA", "EQUIPO", "PLACA", "CONDUCTOR", "SERVICIO", "ESTADO", "FALLA CRITICA", "KM INICIAL", "KM FINAL", "HR INICIAL", "HR FINAL", "EVIDENCIA FOTO URL" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(3, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.LightGray;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            }

            int row = 4;
            foreach (var c in checklists)
            {
                worksheet.Cell(row, 1).Value = c.Id;
                worksheet.Cell(row, 2).Value = c.FechaHora.ToString("dd/MM/yyyy HH:mm");
                worksheet.Cell(row, 3).Value = c.Equipo?.Tipo;
                worksheet.Cell(row, 4).Value = c.EquipoPlaca;
                worksheet.Cell(row, 5).Value = c.Conductor != null ? $"{c.Conductor.Nombre} {c.Conductor.Apellido}" : "N/A";
                worksheet.Cell(row, 6).Value = c.Servicio;
                worksheet.Cell(row, 7).Value = c.Estado;
                worksheet.Cell(row, 8).Value = c.TieneFallasCriticas ? "SÍ" : "NO";
                if (c.TieneFallasCriticas) worksheet.Cell(row, 8).Style.Font.FontColor = XLColor.Red;
                worksheet.Cell(row, 9).Value = c.KilometrajeInicial;
                worksheet.Cell(row, 10).Value = c.KilometrajeFinal;
                worksheet.Cell(row, 11).Value = c.HorometroInicial;
                worksheet.Cell(row, 12).Value = c.HorometroFinal;
                
                // Add hyperlink to photo instead of downloading/embedding
                if (!string.IsNullOrEmpty(c.FotoUrl) && c.FotoUrl != "[]")
                {
                    // Clean up array format if it is JSON array
                    string cleanUrl = c.FotoUrl;
                    if (cleanUrl.StartsWith("["))
                    {
                        var urls = System.Text.Json.JsonSerializer.Deserialize<string[]>(cleanUrl);
                        if (urls != null && urls.Length > 0) cleanUrl = urls[0];
                    }
                    
                    if (Uri.TryCreate(cleanUrl, UriKind.Absolute, out Uri? uriResult) 
                        && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps))
                    {
                        worksheet.Cell(row, 13).Value = "Ver Imagen";
                        worksheet.Cell(row, 13).SetHyperlink(new XLHyperlink(cleanUrl));
                        worksheet.Cell(row, 13).Style.Font.FontColor = XLColor.Blue;
                        worksheet.Cell(row, 13).Style.Font.Underline = XLFontUnderlineValues.Single;
                    }
                    else
                    {
                        worksheet.Cell(row, 13).Value = cleanUrl;
                    }
                }
                
                row++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"CheckList_Digital_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        }
    }
}
