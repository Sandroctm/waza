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
    public class OperacionesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OperacionesController(ApplicationDbContext context)
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
                Modulo = "Operaciones",
                Detalles = details,
                IP = ip,
                Computadora = Request.Headers["User-Agent"].ToString().Length > 100 
                              ? Request.Headers["User-Agent"].ToString()[..100] 
                              : Request.Headers["User-Agent"].ToString()
            };
            _context.AuditoriaLogs.Add(audit);
            _context.SaveChanges();
        }

        // --- 1. TAREOS ---
        [HttpGet("tareos")]
        public IActionResult GetTareos()
        {
            var tareos = _context.Tareos
                .Include(t => t.Equipo)
                .Include(t => t.Operador)
                .Include(t => t.Proyecto)
                .Include(t => t.Conductor)
                .OrderByDescending(t => t.Fecha)
                .ToList();
            return Ok(tareos);
        }

        [HttpPost("tareos")]
        public IActionResult CreateTareo([FromBody] Tareo tareo)
        {
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa == tareo.EquipoPlaca);
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            // CRITICAL CHECK: Block assignment if blocked by SSOMA
            if (equipo.Estado == "Bloqueado por SSOMA" || equipo.Estado == "Fuera de servicio")
            {
                return BadRequest(new { message = $"No se puede asignar el equipo {equipo.Placa} porque se encuentra en estado: '{equipo.Estado}'." });
            }

            // Calculate hours worked
            var duration = tareo.HoraFin - tareo.HoraInicio;
            decimal totalHoras = (decimal)duration.TotalHours;
            if (totalHoras < 0) totalHoras += 24; // Handle shift crossing midnight

            tareo.HorasNormales = Math.Min(totalHoras, 8.0m);
            tareo.HorasExtras = Math.Max(0.0m, totalHoras - 8.0m);

            _context.Tareos.Add(tareo);

            // Also keep equipo state in "Operativo" during activity
            if (equipo.Estado == "Disponible")
            {
                equipo.Estado = "Operativo";
            }

            _context.SaveChanges();

            Audit("Registrar Tareo", $"Tareo registrado para Equipo Placa: {tareo.EquipoPlaca}, Actividad: {tareo.Actividad}, Horas: {totalHoras}");

            return Ok(new { message = "Tareo registrado exitosamente.", tareo });
        }

        // --- 2. HOROMETROS ---
        [HttpGet("horometros")]
        public IActionResult GetHorometros()
        {
            var horometros = _context.Horometros
                .Include(h => h.Equipo)
                .OrderByDescending(h => h.Fecha)
                .ToList();
            return Ok(horometros);
        }

        [HttpPost("horometros")]
        public IActionResult CreateHorometro([FromBody] Horometro horometro)
        {
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa == horometro.EquipoPlaca);
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            horometro.HorasTrabajadas = horometro.Final - horometro.Inicial;
            if (horometro.HorasTrabajadas < 0)
            {
                return BadRequest(new { message = "El horómetro final no puede ser menor que el inicial." });
            }

            _context.Horometros.Add(horometro);

            // Check if maintenance is due (e.g. next maintenance is set to 1500, current is 1460, remainder is 40 hours)
            var horasRestantes = horometro.ProximoMantenimiento - horometro.Final;
            if (horasRestantes <= 50)
            {
                // Create alert if not already exists
                bool alertExists = _context.Alertas.Any(a => a.EquipoPlaca == horometro.EquipoPlaca && a.Tipo == "MantenimientoProximo" && !a.Resuelta);
                if (!alertExists)
                {
                    _context.Alertas.Add(new Alerta
                    {
                        EquipoPlaca = horometro.EquipoPlaca,
                        Tipo = "MantenimientoProximo",
                        Mensaje = $"Mantenimiento preventivo próximo. Horómetro actual: {horometro.Final}. Límite de servicio: {horometro.ProximoMantenimiento} (Faltan {horasRestantes} horas).",
                        FechaCreacion = DateTime.UtcNow,
                        Resuelta = false
                    });
                }
            }

            _context.SaveChanges();

            Audit("Registrar Horómetro", $"Horómetro registrado para Placa: {horometro.EquipoPlaca}, Final: {horometro.Final}, Horas: {horometro.HorasTrabajadas}");

            return Ok(new { message = "Horómetro registrado exitosamente.", horometro, horasRestantes });
        }

        // --- 3. COMBUSTIBLE ---
        [HttpGet("combustibles")]
        public IActionResult GetCombustibles()
        {
            var combustibles = _context.Combustibles
                .Include(c => c.Equipo)
                .Include(c => c.Operador)
                .Include(c => c.Conductor)
                .OrderByDescending(c => c.Fecha)
                .ToList();
            return Ok(combustibles);
        }

        [HttpPost("combustibles")]
        public IActionResult CreateCombustible([FromBody] Combustible combustible)
        {
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa == combustible.EquipoPlaca);
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            combustible.CostoTotal = combustible.Galones * combustible.PrecioGalon;
            _context.Combustibles.Add(combustible);
            _context.SaveChanges();

            // Store in Excel database replica
            try
            {
                var cond = combustible.ConductorId.HasValue ? _context.Conductores.FirstOrDefault(c => c.Id == combustible.ConductorId) : null;
                string condStr = cond != null ? $"{cond.Nombre} {cond.Apellido}" : "Sin conductor";
                Sigecosem.WebApi.Helpers.ExcelDbHelper.AppendCombustible(
                    combustible.EquipoPlaca,
                    condStr,
                    combustible.Galones,
                    combustible.CostoTotal,
                    combustible.HorometroVal,
                    combustible.FotoUrl,
                    ""
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed to append combustible to excel: " + ex.Message);
            }

            Audit("Registrar Combustible", $"Combustible registrado para Placa: {combustible.EquipoPlaca}, Galones: {combustible.Galones}, Costo Total: {combustible.CostoTotal}");

            return Ok(new { message = "Combustible registrado exitosamente.", combustible });
        }

        // --- 4. MANTENIMIENTOS ---
        [HttpGet("mantenimientos")]
        public IActionResult GetMantenimientos()
        {
            var mantenimientos = _context.Mantenimientos
                .Include(m => m.Equipo)
                .OrderByDescending(m => m.Fecha)
                .ToList();
            return Ok(mantenimientos);
        }

        [HttpPost("mantenimientos")]
        public IActionResult CreateMantenimiento([FromBody] Mantenimiento mantenimiento)
        {
            var equipo = _context.Equipos.FirstOrDefault(e => e.Placa == mantenimiento.EquipoPlaca);
            if (equipo == null) return NotFound(new { message = "Equipo no encontrado" });

            _context.Mantenimientos.Add(mantenimiento);

            // If it was in corrective or preventive maintenance, return it to Disponible/Operativo
            if (equipo.Estado.Contains("mantenimiento"))
            {
                equipo.Estado = "Disponible";
            }

            // Resolve any "MantenimientoProximo" alerts for this machine
            var maintenanceAlerts = _context.Alertas.Where(a => a.EquipoPlaca == mantenimiento.EquipoPlaca && a.Tipo == "MantenimientoProximo" && !a.Resuelta).ToList();
            foreach (var alert in maintenanceAlerts)
            {
                alert.Resuelta = true;
                alert.ResueltaPorId = GetCurrentUserId();
                alert.FechaResolucion = DateTime.UtcNow;
            }

            _context.SaveChanges();

            Audit("Registrar Mantenimiento", $"Mantenimiento {mantenimiento.Tipo} registrado para Placa: {mantenimiento.EquipoPlaca}, Costo: {mantenimiento.CostoTotal}");

            return Ok(new { message = "Mantenimiento registrado y alertas resueltas.", mantenimiento, equipoEstado = equipo.Estado });
        }
    }
}
