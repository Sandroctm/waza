using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sigecosem.WebApi.Data;
using Sigecosem.WebApi.Models;

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
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa == checklist.EquipoPlaca);
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            // Set calendar fields
            checklist.FechaHora = DateTime.UtcNow;
            
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
    }
}
