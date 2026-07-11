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
    }
}
