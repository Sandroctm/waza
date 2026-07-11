using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sigecosem.WebApi.Data;
using Sigecosem.WebApi.Models;
using Sigecosem.WebApi.Services;

namespace Sigecosem.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AuthService _authService;

        public AuthController(ApplicationDbContext context, AuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Usuario y contraseña son requeridos." });
            }

            var user = _context.Usuarios
                .Include(u => u.Rol)
                .Include(u => u.Area)
                .FirstOrDefault(u => u.Username.ToLower() == request.Username.ToLower());

            if (user == null)
            {
                return Unauthorized(new { message = "Credenciales incorrectas." });
            }

            if (!user.Activo)
            {
                return BadRequest(new { message = "El usuario está inactivo. Contacte al administrador." });
            }

            // Lockout check
            if (user.BloqueadoHasta.HasValue && user.BloqueadoHasta.Value > DateTime.UtcNow)
            {
                var remaining = user.BloqueadoHasta.Value - DateTime.UtcNow;
                return BadRequest(new { message = $"Usuario bloqueado por múltiples intentos. Reintente en {remaining.Minutes} min {remaining.Seconds} seg." });
            }

            bool isValid = _authService.VerifyPassword(request.Password, user.PasswordHash);

            if (!isValid)
            {
                user.IntentosFallidos++;
                if (user.IntentosFallidos >= 5)
                {
                    user.BloqueadoHasta = DateTime.UtcNow.AddMinutes(15);
                    user.IntentosFallidos = 0;
                    _context.SaveChanges();
                    return BadRequest(new { message = "Cuenta bloqueada por 15 minutos debido a 5 intentos fallidos." });
                }

                _context.SaveChanges();
                return Unauthorized(new { message = "Credenciales incorrectas." });
            }

            // Success, reset attempts
            user.IntentosFallidos = 0;
            user.BloqueadoHasta = null;
            _context.SaveChanges();

            var token = _authService.GenerateToken(user);

            // Audit login
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var audit = new AuditoriaLog
            {
                UsuarioId = user.Id,
                Accion = "Inicio de Sesión",
                Modulo = "Autenticación",
                Detalles = $"Usuario '{user.Username}' inició sesión correctamente.",
                IP = ip,
                Computadora = Request.Headers["User-Agent"].ToString().Length > 100 
                              ? Request.Headers["User-Agent"].ToString()[..100] 
                              : Request.Headers["User-Agent"].ToString()
            };
            _context.AuditoriaLogs.Add(audit);
            _context.SaveChanges();

            return Ok(new
            {
                token,
                usuario = new
                {
                    user.Id,
                    user.Username,
                    user.Nombre,
                    user.Apellido,
                    Rol = user.Rol?.Nombre,
                    Area = user.Area?.Nombre,
                    Permisos = user.Rol?.Permisos.Split(',') ?? Array.Empty<string>()
                }
            });
        }
    }
}
