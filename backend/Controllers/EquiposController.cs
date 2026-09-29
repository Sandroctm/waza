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
    public class EquiposController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EquiposController(ApplicationDbContext context)
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
                UsuarioId = GetCurrentUserId() ?? 1, // Fallback to Admin seed if anonymous
                Accion = action,
                Modulo = "Flota / Equipos",
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
        public IActionResult Get([FromQuery] string? tipo, [FromQuery] string? estado)
        {
            var query = _context.Equipos
                .Include(e => e.Area)
                .Include(e => e.Proyecto)
                .Include(e => e.Supervisor)
                .Include(e => e.Operador)
                .AsQueryable();

            if (!string.IsNullOrEmpty(tipo))
                query = query.Where(e => e.Tipo.ToLower() == tipo.ToLower());

            if (!string.IsNullOrEmpty(estado))
                query = query.Where(e => e.Estado.ToLower() == estado.ToLower());

            return Ok(query.ToList());
        }

        [HttpGet("kpis")]
        public IActionResult GetKpis()
        {
            var total = _context.Equipos.Count();
            var disponible = _context.Equipos.Count(e => e.Estado == "Disponible");
            var operativo = _context.Equipos.Count(e => e.Estado == "Operativo");
            var mantenimientoPrev = _context.Equipos.Count(e => e.Estado == "En mantenimiento preventivo");
            var mantenimientoCorr = _context.Equipos.Count(e => e.Estado == "En mantenimiento correctivo");
            var bloqueado = _context.Equipos.Count(e => e.Estado == "Bloqueado por SSOMA");
            var fueraServicio = _context.Equipos.Count(e => e.Estado == "Fuera de servicio" || e.Estado == "En espera de repuestos");

            return Ok(new { total, disponible, operativo, mantenimientoPrev, mantenimientoCorr, bloqueado, fueraServicio });
        }

        // ===== PROYECTOS (must be BEFORE {placa} route) =====

        [HttpGet("proyectos")]
        public IActionResult GetProyectos()
        {
            var proyectos = _context.Proyectos.Where(p => p.Activo).OrderBy(p => p.Nombre).ToList();
            return Ok(proyectos);
        }

        [HttpPost("proyectos")]
        public IActionResult CreateProyecto([FromBody] Proyecto proyecto)
        {
            if (string.IsNullOrWhiteSpace(proyecto.Nombre))
                return BadRequest(new { message = "El nombre del proyecto es requerido." });

            var existing = _context.Proyectos.FirstOrDefault(p => p.Nombre.ToLower() == proyecto.Nombre.ToLower());
            if (existing != null)
            {
                if (!existing.Activo) { existing.Activo = true; _context.SaveChanges(); }
                return Ok(existing);
            }

            proyecto.Activo = true;
            _context.Proyectos.Add(proyecto);
            _context.SaveChanges();

            Audit("Crear Proyecto", $"Proyecto creado: {proyecto.Nombre}");
            return Ok(proyecto);
        }

        [HttpGet("{placa}")]
        public IActionResult GetByPlaca(string placa)
        {
            var equipo = _context.Equipos
                .Include(e => e.Area)
                .Include(e => e.Proyecto)
                .Include(e => e.Supervisor)
                .Include(e => e.Operador)
                .FirstOrDefault(e => e.Placa.ToUpper() == placa.ToUpper());

            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            // Expediente digital aggregation
            var checklists = _context.CheckLists
                .Include(c => c.Operador)
                .Include(c => c.Supervisor)
                .Where(c => c.EquipoPlaca == placa)
                .OrderByDescending(c => c.FechaHora)
                .Take(20).ToList();

            var tareos = _context.Tareos
                .Include(t => t.Operador)
                .Where(t => t.EquipoPlaca == placa)
                .OrderByDescending(t => t.Fecha)
                .Take(20).ToList();

            var horometros = _context.Horometros
                .Where(h => h.EquipoPlaca == placa)
                .OrderByDescending(h => h.Fecha)
                .Take(20).ToList();

            var combustibles = _context.Combustibles
                .Include(c => c.Operador)
                .Where(c => c.EquipoPlaca == placa)
                .OrderByDescending(c => c.Fecha)
                .Take(20).ToList();

            var mantenimientos = _context.Mantenimientos
                .Where(m => m.EquipoPlaca == placa)
                .OrderByDescending(m => m.Fecha)
                .Take(20).ToList();

            var documentos = _context.Documentos
                .Where(d => d.EquipoPlaca == placa)
                .OrderByDescending(d => d.FechaSubida)
                .ToList();

            var gps = _context.GpsDatas.FirstOrDefault(g => g.EquipoPlaca == placa);

            var alertas = _context.Alertas
                .Where(a => a.EquipoPlaca == placa && !a.Resuelta)
                .OrderByDescending(a => a.FechaCreacion)
                .ToList();

            return Ok(new
            {
                equipo,
                checklists,
                tareos,
                horometros,
                combustibles,
                mantenimientos,
                documentos,
                gps,
                alertas
            });
        }

        [HttpPost]
        public IActionResult Create([FromBody] Equipo equipo)
        {
            if (string.IsNullOrWhiteSpace(equipo.Placa))
                return BadRequest(new { message = "La placa es requerida." });

            if (_context.Equipos.Any(e => e.Placa.ToUpper() == equipo.Placa.ToUpper()))
                return BadRequest(new { message = "Ya existe un equipo registrado con esa placa." });

            equipo.Placa = equipo.Placa.ToUpper();
            _context.Equipos.Add(equipo);

            // Add default GPS entry
            _context.GpsDatas.Add(new GpsData
            {
                EquipoPlaca = equipo.Placa,
                Latitud = -12.04637m,
                Longitud = -75.2103m, // Huancayo default coordinates
                Velocidad = 0,
                TiempoDetenidoMinutos = 0,
                MotorEncendido = false
            });

            _context.SaveChanges();

            // Store in Excel database replica
            try
            {
                Sigecosem.WebApi.Helpers.ExcelDbHelper.AppendEquipo(
                    equipo.Placa,
                    equipo.CodigoInterno,
                    equipo.Tipo,
                    equipo.Marca,
                    equipo.Modelo,
                    equipo.Serie,
                    equipo.Motor,
                    equipo.Chasis,
                    equipo.Color,
                    equipo.Estado,
                    equipo.AnioFabricacion,
                    equipo.Valor
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed to append equipment to excel: " + ex.Message);
            }

            Audit("Crear Equipo", $"Equipo registrado Placa: {equipo.Placa}, Código: {equipo.CodigoInterno}");
            return CreatedAtAction(nameof(GetByPlaca), new { placa = equipo.Placa }, equipo);
        }

        [HttpPut("{placa}")]
        public IActionResult Update(string placa, [FromBody] Equipo equipoInput)
        {
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa == placa);
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            equipo.CodigoInterno = equipoInput.CodigoInterno;
            equipo.Tipo = equipoInput.Tipo;
            equipo.Marca = equipoInput.Marca;
            equipo.Modelo = equipoInput.Modelo;
            equipo.Serie = equipoInput.Serie;
            equipo.Motor = equipoInput.Motor;
            equipo.Chasis = equipoInput.Chasis;
            equipo.Color = equipoInput.Color;
            equipo.ProyectoId = equipoInput.ProyectoId;
            equipo.AreaId = equipoInput.AreaId;
            equipo.SupervisorId = equipoInput.SupervisorId;
            equipo.OperadorId = equipoInput.OperadorId;
            equipo.Estado = equipoInput.Estado;
            equipo.Seguro = equipoInput.Seguro;
            equipo.SOATVencimiento = equipoInput.SOATVencimiento;
            equipo.RevisionTecnicaVencimiento = equipoInput.RevisionTecnicaVencimiento;
            equipo.PermisoCirculacionVencimiento = equipoInput.PermisoCirculacionVencimiento;
            equipo.PolizaVencimiento = equipoInput.PolizaVencimiento;
            equipo.AnioFabricacion = equipoInput.AnioFabricacion;
            equipo.Valor = equipoInput.Valor;
            equipo.FotoUrl = equipoInput.FotoUrl;

            _context.SaveChanges();

            Audit("Modificar Equipo", $"Equipo actualizado Placa: {placa}");
            return Ok(equipo);
        }

        [HttpPost("{placa}/block")]
        public IActionResult Block(string placa, [FromBody] string motivo)
        {
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa == placa);
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            equipo.Estado = "Bloqueado por SSOMA";

            // Add alert
            _context.Alertas.Add(new Alerta
            {
                EquipoPlaca = placa,
                Tipo = "FallaCritica",
                Mensaje = $"Equipo bloqueado por SSOMA. Motivo: {motivo}",
                FechaCreacion = DateTime.UtcNow,
                Resuelta = false
            });

            _context.SaveChanges();

            Audit("Bloquear Equipo", $"Equipo bloqueado Placa: {placa}. Motivo: {motivo}");
            return Ok(new { message = "Equipo bloqueado exitosamente.", equipo });
        }

        [HttpPost("{placa}/release")]
        public IActionResult Release(string placa, [FromBody] string motivo)
        {
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa == placa);
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            equipo.Estado = "Disponible";

            // Resolve alerts
            var alerts = _context.Alertas.Where(a => a.EquipoPlaca == placa && !a.Resuelta).ToList();
            foreach (var alert in alerts)
            {
                alert.Resuelta = true;
                alert.ResueltaPorId = GetCurrentUserId();
                alert.FechaResolucion = DateTime.UtcNow;
            }

            _context.SaveChanges();

            Audit("Liberar Equipo", $"Equipo liberado Placa: {placa}. Justificación: {motivo}");
            return Ok(new { message = "Equipo liberado exitosamente.", equipo });
        }

        [HttpDelete("{placa}")]
        public IActionResult Delete(string placa)
        {
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa.ToUpper() == placa.ToUpper());
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            // Remove related records to avoid FK constraints
            var checklists = _context.CheckLists.Where(c => c.EquipoPlaca.ToUpper() == placa.ToUpper());
            _context.CheckLists.RemoveRange(checklists);

            var tareos = _context.Tareos.Where(t => t.EquipoPlaca.ToUpper() == placa.ToUpper());
            _context.Tareos.RemoveRange(tareos);

            var horometros = _context.Horometros.Where(h => h.EquipoPlaca.ToUpper() == placa.ToUpper());
            _context.Horometros.RemoveRange(horometros);

            var combustibles = _context.Combustibles.Where(c => c.EquipoPlaca.ToUpper() == placa.ToUpper());
            _context.Combustibles.RemoveRange(combustibles);

            var mantenimientos = _context.Mantenimientos.Where(m => m.EquipoPlaca.ToUpper() == placa.ToUpper());
            _context.Mantenimientos.RemoveRange(mantenimientos);

            var documentos = _context.Documentos.Where(d => d.EquipoPlaca.ToUpper() == placa.ToUpper());
            _context.Documentos.RemoveRange(documentos);

            var gps = _context.GpsDatas.Where(g => g.EquipoPlaca.ToUpper() == placa.ToUpper());
            _context.GpsDatas.RemoveRange(gps);

            var alertas = _context.Alertas.Where(a => a.EquipoPlaca.ToUpper() == placa.ToUpper());
            _context.Alertas.RemoveRange(alertas);

            _context.Equipos.Remove(equipo);
            _context.SaveChanges();

            Audit("Eliminar Equipo", $"Equipo eliminado Placa: {placa}");
            return Ok(new { message = "Equipo eliminado exitosamente." });
        }

        // ===== DOCUMENTOS POR EQUIPO =====

        [HttpGet("{placa}/documentos")]
        public IActionResult GetDocumentos(string placa)
        {
            var docs = _context.Documentos
                .Where(d => d.EquipoPlaca.ToUpper() == placa.ToUpper())
                .OrderByDescending(d => d.FechaSubida)
                .ToList();
            return Ok(docs);
        }

        [HttpPost("{placa}/documentos")]
        public IActionResult CreateDocumento(string placa, [FromBody] Documento documento)
        {
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa.ToUpper() == placa.ToUpper());
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            documento.EquipoPlaca = placa.ToUpper();
            documento.FechaSubida = DateTime.UtcNow;
            _context.Documentos.Add(documento);

            // Si es SOAT, actualizar la fecha en el equipo
            if (documento.Tipo?.ToLower() == "soat" && documento.FechaVencimiento.HasValue)
            {
                equipo.SOATVencimiento = documento.FechaVencimiento.Value;
            }
            else if (documento.Tipo?.ToLower().Contains("revision") == true && documento.FechaVencimiento.HasValue)
            {
                equipo.RevisionTecnicaVencimiento = documento.FechaVencimiento.Value;
            }

            _context.SaveChanges();
            Audit("Subir Documento", $"Documento '{documento.Nombre}' ({documento.Tipo}) agregado al equipo {placa}");
            return Ok(documento);
        }

        [HttpDelete("{placa}/documentos/{id}")]
        public IActionResult DeleteDocumento(string placa, int id)
        {
            var doc = _context.Documentos.FirstOrDefault(d => d.Id == id && d.EquipoPlaca.ToUpper() == placa.ToUpper());
            if (doc == null) return NotFound(new { message = "Documento no encontrado" });

            _context.Documentos.Remove(doc);
            _context.SaveChanges();
            Audit("Eliminar Documento", $"Documento id={id} eliminado del equipo {placa}");
            return Ok(new { message = "Documento eliminado." });
        }

        [HttpPost("{placa}/documentos/upload")]
        public async Task<IActionResult> UploadDocumento(string placa, [FromForm] IFormFile file, [FromForm] string nombre, [FromForm] string tipo, [FromForm] DateTime? fechaVencimiento)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Archivo no proporcionado" });

            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa.ToUpper() == placa.ToUpper());
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "documentos", placa);
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/documentos/{placa}/{fileName}";

            var documento = new Documento
            {
                EquipoPlaca = placa.ToUpper(),
                Nombre = nombre,
                Tipo = tipo,
                Url = url,
                FechaVencimiento = fechaVencimiento,
                FechaSubida = DateTime.UtcNow
            };

            _context.Documentos.Add(documento);

            if (tipo?.ToLower() == "soat" && fechaVencimiento.HasValue)
                equipo.SOATVencimiento = fechaVencimiento.Value;
            else if (tipo?.ToLower().Contains("revision") == true && fechaVencimiento.HasValue)
                equipo.RevisionTecnicaVencimiento = fechaVencimiento.Value;
            else if (tipo?.ToLower().Contains("poliza") == true && fechaVencimiento.HasValue)
                equipo.PolizaVencimiento = fechaVencimiento.Value;
            else if (tipo?.ToLower().Contains("circulacion") == true && fechaVencimiento.HasValue)
                equipo.PermisoCirculacionVencimiento = fechaVencimiento.Value;

            _context.SaveChanges();
            Audit("Subir Documento", $"Documento PDF '{nombre}' ({tipo}) subido al equipo {placa}");

            return Ok(documento);
        }
    }
}
