using System;
using System.Linq;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sigecosem.WebApi.Data;
using Sigecosem.WebApi.Models;

namespace Sigecosem.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConfigController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ConfigController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class SystemBackupDto
        {
            public DateTime Date { get; set; }
            public List<Rol> Roles { get; set; } = new();
            public List<Area> Areas { get; set; } = new();
            public List<Proyecto> Proyectos { get; set; } = new();
            public List<Usuario> Usuarios { get; set; } = new();
            public List<Equipo> Equipos { get; set; } = new();
            public List<CheckList> CheckLists { get; set; } = new();
            public List<Tareo> Tareos { get; set; } = new();
            public List<Horometro> Horometros { get; set; } = new();
            public List<Combustible> Combustibles { get; set; } = new();
            public List<Mantenimiento> Mantenimientos { get; set; } = new();
        }

        [HttpGet("backup")]
        public IActionResult ExportBackup()
        {
            var backup = new SystemBackupDto
            {
                Date = DateTime.UtcNow,
                Roles = _context.Roles.ToList(),
                Areas = _context.Areas.ToList(),
                Proyectos = _context.Proyectos.ToList(),
                Usuarios = _context.Usuarios.ToList(),
                Equipos = _context.Equipos.ToList(),
                CheckLists = _context.CheckLists.ToList(),
                Tareos = _context.Tareos.ToList(),
                Horometros = _context.Horometros.ToList(),
                Combustibles = _context.Combustibles.ToList(),
                Mantenimientos = _context.Mantenimientos.ToList()
            };

            var json = JsonSerializer.Serialize(backup, new JsonSerializerOptions { WriteIndented = true });
            return File(System.Text.Encoding.UTF8.GetBytes(json), "application/json", $"sigecosem-backup-{DateTime.UtcNow:yyyyMMddHHmmss}.json");
        }

        [HttpPost("restore")]
        public IActionResult ImportRestore([FromBody] SystemBackupDto backup)
        {
            if (backup == null) return BadRequest(new { message = "Carga de respaldo inválida." });

            try
            {
                // Clear tables in order
                _context.Mantenimientos.ExecuteDelete();
                _context.Combustibles.ExecuteDelete();
                _context.Horometros.ExecuteDelete();
                _context.Tareos.ExecuteDelete();
                _context.CheckLists.ExecuteDelete();
                _context.GpsDatas.ExecuteDelete();
                _context.Alertas.ExecuteDelete();
                _context.Equipos.ExecuteDelete();
                _context.Usuarios.ExecuteDelete();
                _context.Proyectos.ExecuteDelete();
                _context.Areas.ExecuteDelete();
                _context.Roles.ExecuteDelete();

                _context.SaveChanges();

                // Restore tables
                if (backup.Roles.Any()) _context.Roles.AddRange(backup.Roles);
                if (backup.Areas.Any()) _context.Areas.AddRange(backup.Areas);
                if (backup.Proyectos.Any()) _context.Proyectos.AddRange(backup.Proyectos);
                _context.SaveChanges(); // Save lookup tables first

                if (backup.Usuarios.Any()) _context.Usuarios.AddRange(backup.Usuarios);
                if (backup.Equipos.Any())
                {
                    _context.Equipos.AddRange(backup.Equipos);
                    // Recreate GPS elements
                    foreach (var eq in backup.Equipos)
                    {
                        _context.GpsDatas.Add(new GpsData
                        {
                            EquipoPlaca = eq.Placa,
                            Latitud = -12.04637m,
                            Longitud = -75.2103m,
                            Velocidad = 0,
                            TiempoDetenidoMinutos = 0,
                            MotorEncendido = false
                        });
                    }
                }
                _context.SaveChanges();

                if (backup.CheckLists.Any()) _context.CheckLists.AddRange(backup.CheckLists);
                if (backup.Tareos.Any()) _context.Tareos.AddRange(backup.Tareos);
                if (backup.Horometros.Any()) _context.Horometros.AddRange(backup.Horometros);
                if (backup.Combustibles.Any()) _context.Combustibles.AddRange(backup.Combustibles);
                if (backup.Mantenimientos.Any()) _context.Mantenimientos.AddRange(backup.Mantenimientos);

                _context.SaveChanges();

                return Ok(new { message = "Base de datos restaurada correctamente a partir de la copia de seguridad." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error en restauración: {ex.Message}" });
            }
        }
    }
}
