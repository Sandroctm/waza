using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sigecosem.WebApi.Data;
using Sigecosem.WebApi.Models;

namespace Sigecosem.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ConductoresController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ConductoresController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetConductores()
        {
            var conductores = await _context.Conductores
                .Where(c => c.Activo)
                .OrderBy(c => c.Apellido)
                .ToListAsync();
            return Ok(conductores);
        }

        [HttpGet("todos")]
        public async Task<IActionResult> GetTodosConductores()
        {
            var conductores = await _context.Conductores
                .OrderBy(c => c.Apellido)
                .ToListAsync();
            return Ok(conductores);
        }

        [HttpPost]
        public async Task<IActionResult> CreateConductor([FromBody] Conductor conductor)
        {
            if (string.IsNullOrEmpty(conductor.Nombre) || string.IsNullOrEmpty(conductor.Apellido))
            {
                return BadRequest(new { message = "Nombre y Apellido son obligatorios." });
            }

            conductor.Activo = true;
            _context.Conductores.Add(conductor);
            await _context.SaveChangesAsync();

            // Store in Excel database replica
            try
            {
                Sigecosem.WebApi.Helpers.ExcelDbHelper.AppendConductor(
                    conductor.Nombre,
                    conductor.Apellido,
                    conductor.Dni,
                    conductor.Licencia,
                    conductor.CategoriaLicencia,
                    conductor.Telefono,
                    conductor.EquipoPlacaAsignada
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed to append conductor to excel: " + ex.Message);
            }

            return Ok(conductor);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConductor(int id)
        {
            var conductor = await _context.Conductores.FindAsync(id);
            if (conductor == null) return NotFound(new { message = "Conductor no encontrado." });

            conductor.Activo = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Conductor desactivado correctamente." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateConductor(int id, [FromBody] Conductor conductorDto)
        {
            var conductor = await _context.Conductores.FindAsync(id);
            if (conductor == null) return NotFound(new { message = "Conductor no encontrado." });

            conductor.Nombre = conductorDto.Nombre;
            conductor.Apellido = conductorDto.Apellido;
            conductor.Dni = conductorDto.Dni;
            conductor.Licencia = conductorDto.Licencia;
            conductor.CategoriaLicencia = conductorDto.CategoriaLicencia;
            conductor.Telefono = conductorDto.Telefono;
            conductor.TipoEquipoAutorizado = conductorDto.TipoEquipoAutorizado;
            conductor.Activo = true;
            if (!string.IsNullOrEmpty(conductorDto.EquipoPlacaAsignada))
            {
                conductor.EquipoPlacaAsignada = conductorDto.EquipoPlacaAsignada;
            }

            await _context.SaveChangesAsync();
            return Ok(conductor);
        }
    }
}
