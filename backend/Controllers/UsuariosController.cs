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
    public class UsuariosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AuthService _authService;

        public UsuariosController(ApplicationDbContext context, AuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : null;
        }

        [HttpGet("roles")]
        public IActionResult GetRoles()
        {
            // Ensure Conductor role exists
            var conductorRole = _context.Roles.FirstOrDefault(r => r.Nombre == "Conductor");
            if (conductorRole == null)
            {
                conductorRole = new Rol { Nombre = "Conductor", Permisos = "dashboard:view,equipos:view,checklist:write" };
                _context.Roles.Add(conductorRole);
                _context.SaveChanges();
            }

            var roles = _context.Roles.ToList();
            return Ok(roles);
        }

        [HttpGet("areas")]
        public IActionResult GetAreas()
        {
            var areas = _context.Areas.ToList();
            return Ok(areas);
        }

        public class CreateUsuarioDto
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Nombre { get; set; } = string.Empty;
            public string Apellido { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public int? RolId { get; set; }
            public string? NuevoRolNombre { get; set; }
            public int? AreaId { get; set; }
            public string? NuevaAreaNombre { get; set; }
            public string Permisos { get; set; } = string.Empty;
            public string Cargo { get; set; } = string.Empty;
        }

        public class UpdateUsuarioDto
        {
            public string? Username { get; set; }
            public string? Password { get; set; }
            public string? Nombre { get; set; }
            public string? Apellido { get; set; }
            public string? Email { get; set; }
            public int? RolId { get; set; }
            public string? NuevoRolNombre { get; set; }
            public int? AreaId { get; set; }
            public string? NuevaAreaNombre { get; set; }
            public string? Permisos { get; set; }
            public string? Cargo { get; set; }
        }

        [HttpPost]
        public IActionResult CreateUsuario([FromBody] CreateUsuarioDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Usuario y contraseña son requeridos." });
            }

            if (_context.Usuarios.Any(u => u.Username.ToLower() == dto.Username.ToLower()))
            {
                return BadRequest(new { message = "Ya existe un usuario con ese nombre de usuario." });
            }

            int finalRolId = 0;
            string defaultRolPermisos = "";
            if (dto.RolId.HasValue && dto.RolId.Value > 0)
            {
                finalRolId = dto.RolId.Value;
                var dbRol = _context.Roles.FirstOrDefault(r => r.Id == finalRolId);
                if (dbRol != null) defaultRolPermisos = dbRol.Permisos;
            }
            else if (!string.IsNullOrWhiteSpace(dto.NuevoRolNombre))
            {
                var existingRole = _context.Roles.FirstOrDefault(r => r.Nombre.ToLower() == dto.NuevoRolNombre.ToLower());
                if (existingRole != null)
                {
                    finalRolId = existingRole.Id;
                    defaultRolPermisos = existingRole.Permisos;
                }
                else
                {
                    var newRole = new Rol { Nombre = dto.NuevoRolNombre, Permisos = "dashboard:view,equipos:view" };
                    _context.Roles.Add(newRole);
                    _context.SaveChanges();
                    finalRolId = newRole.Id;
                    defaultRolPermisos = newRole.Permisos;
                }
            }
            else
            {
                return BadRequest(new { message = "Debe especificar un Rol existente o un nuevo nombre de Rol." });
            }

            int? finalAreaId = dto.AreaId;
            if ((!finalAreaId.HasValue || finalAreaId.Value <= 0) && !string.IsNullOrWhiteSpace(dto.NuevaAreaNombre))
            {
                var existingArea = _context.Areas.FirstOrDefault(a => a.Nombre.ToLower() == dto.NuevaAreaNombre.ToLower());
                if (existingArea != null)
                {
                    finalAreaId = existingArea.Id;
                }
                else
                {
                    var newArea = new Area { Nombre = dto.NuevaAreaNombre };
                    _context.Areas.Add(newArea);
                    _context.SaveChanges();
                    finalAreaId = newArea.Id;
                }
            }

            var usuario = new Usuario
            {
                Username = dto.Username,
                PasswordHash = _authService.HashPassword(dto.Password),
                Nombre = dto.Nombre,
                Apellido = dto.Apellido,
                Email = dto.Email,
                RolId = finalRolId,
                AreaId = finalAreaId,
                Cargo = dto.Cargo ?? string.Empty,
                Activo = true,
                Permisos = string.IsNullOrWhiteSpace(dto.Permisos) ? defaultRolPermisos : dto.Permisos
            };

            _context.Usuarios.Add(usuario);

            // Audit
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var audit = new AuditoriaLog
            {
                UsuarioId = GetCurrentUserId() ?? 1,
                Accion = "Crear Usuario",
                Modulo = "Gestión de Usuarios",
                Detalles = $"Usuario creado: {usuario.Username} con Cargo: {usuario.Cargo}",
                IP = ip,
                Computadora = Request.Headers["User-Agent"].ToString().Length > 100 
                              ? Request.Headers["User-Agent"].ToString()[..100] 
                              : Request.Headers["User-Agent"].ToString()
            };
            _context.AuditoriaLogs.Add(audit);

            _context.SaveChanges();

            return Ok(new { message = "Usuario creado exitosamente.", usuarioId = usuario.Id });
        }

        [HttpPut("{id}")]
        public IActionResult UpdateUsuario(int id, [FromBody] UpdateUsuarioDto dto)
        {
            var user = _context.Usuarios.FirstOrDefault(u => u.Id == id);
            if (user == null) return NotFound(new { message = "Usuario no encontrado." });

            if (!string.IsNullOrWhiteSpace(dto.Username) && dto.Username.ToLower() != user.Username.ToLower())
            {
                if (_context.Usuarios.Any(u => u.Id != id && u.Username.ToLower() == dto.Username.ToLower()))
                {
                    return BadRequest(new { message = "El nombre de usuario ya se encuentra en uso por otra cuenta." });
                }
                user.Username = dto.Username;
            }

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = _authService.HashPassword(dto.Password);
            }

            if (dto.Nombre != null) user.Nombre = dto.Nombre;
            if (dto.Apellido != null) user.Apellido = dto.Apellido;
            if (dto.Email != null) user.Email = dto.Email;
            if (dto.Cargo != null) user.Cargo = dto.Cargo;

            if (dto.RolId.HasValue && dto.RolId.Value > 0)
            {
                user.RolId = dto.RolId.Value;
            }
            else if (!string.IsNullOrWhiteSpace(dto.NuevoRolNombre))
            {
                var existingRole = _context.Roles.FirstOrDefault(r => r.Nombre.ToLower() == dto.NuevoRolNombre.ToLower());
                if (existingRole != null)
                {
                    user.RolId = existingRole.Id;
                }
                else
                {
                    var newRole = new Rol { Nombre = dto.NuevoRolNombre, Permisos = "dashboard:view,equipos:view" };
                    _context.Roles.Add(newRole);
                    _context.SaveChanges();
                    user.RolId = newRole.Id;
                }
            }

            if (dto.AreaId.HasValue && dto.AreaId.Value > 0)
            {
                user.AreaId = dto.AreaId.Value;
            }
            else if (!string.IsNullOrWhiteSpace(dto.NuevaAreaNombre))
            {
                var existingArea = _context.Areas.FirstOrDefault(a => a.Nombre.ToLower() == dto.NuevaAreaNombre.ToLower());
                if (existingArea != null)
                {
                    user.AreaId = existingArea.Id;
                }
                else
                {
                    var newArea = new Area { Nombre = dto.NuevaAreaNombre };
                    _context.Areas.Add(newArea);
                    _context.SaveChanges();
                    user.AreaId = newArea.Id;
                }
            }

            if (dto.Permisos != null)
            {
                user.Permisos = dto.Permisos;
            }

            _context.SaveChanges();

            return Ok(new { message = $"Usuario '{user.Username}' actualizado exitosamente.", usuario = user });
        }

        [HttpGet]
        public IActionResult GetUsuarios()
        {
            var usuarios = _context.Usuarios
                .Include(u => u.Rol)
                .Include(u => u.Area)
                .OrderBy(u => u.Username)
                .Select(u => new {
                    u.Id,
                    u.Username,
                    u.Nombre,
                    u.Apellido,
                    u.Email,
                    u.Activo,
                    u.Cargo,
                    RolId = u.RolId,
                    Rol = u.Rol != null ? u.Rol.Nombre : "",
                    AreaId = u.AreaId,
                    Area = u.Area != null ? u.Area.Nombre : "",
                    Permisos = u.Permisos
                })
                .ToList();
            return Ok(usuarios);
        }

        [HttpPut("{id}/toggle-activo")]
        public IActionResult ToggleActivo(int id)
        {
            var user = _context.Usuarios.FirstOrDefault(u => u.Id == id);
            if (user == null) return NotFound(new { message = "Usuario no encontrado." });

            if (user.Id == 1 || user.Username.ToLower() == "admin")
            {
                return BadRequest(new { message = "No se puede desactivar la cuenta del administrador principal." });
            }

            user.Activo = !user.Activo;
            _context.SaveChanges();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var audit = new AuditoriaLog
            {
                UsuarioId = GetCurrentUserId() ?? 1,
                Accion = "Modificar Usuario",
                Modulo = "Gestión de Usuarios",
                Detalles = $"Estado activo cambiado para {user.Username} a {user.Activo}",
                IP = ip,
                Computadora = Request.Headers["User-Agent"].ToString().Length > 100 
                              ? Request.Headers["User-Agent"].ToString()[..100] 
                              : Request.Headers["User-Agent"].ToString()
            };
            _context.AuditoriaLogs.Add(audit);
            _context.SaveChanges();

            return Ok(new { message = $"Usuario {(user.Activo ? "activado" : "desactivado")} correctamente.", activo = user.Activo });
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteUsuario(int id)
        {
            var user = _context.Usuarios.FirstOrDefault(u => u.Id == id);
            if (user == null) return NotFound(new { message = "Usuario no encontrado." });

            if (user.Id == 1 || user.Username.ToLower() == "admin")
            {
                return BadRequest(new { message = "No se puede eliminar al administrador principal." });
            }

            try
            {
                _context.Usuarios.Remove(user);
                
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                var audit = new AuditoriaLog
                {
                    UsuarioId = GetCurrentUserId() ?? 1,
                    Accion = "Eliminar Usuario",
                    Modulo = "Gestión de Usuarios",
                    Detalles = $"Usuario eliminado físicamente: {user.Username}",
                    IP = ip,
                    Computadora = Request.Headers["User-Agent"].ToString().Length > 100 
                                  ? Request.Headers["User-Agent"].ToString()[..100] 
                                  : Request.Headers["User-Agent"].ToString()
                };
                _context.AuditoriaLogs.Add(audit);
                _context.SaveChanges();
                
                return Ok(new { message = "Usuario eliminado exitosamente." });
            }
            catch (Exception)
            {
                return BadRequest(new { message = "El usuario tiene registros históricos (checklist, tareos, etc.) vinculados. Se recomienda desactivar la cuenta en lugar de eliminarla físicamente." });
            }
        }

        // ===== GESTIÓN DE PERMISOS DE ROL =====

        public class UpdatePermisosDto
        {
            public string Permisos { get; set; } = string.Empty; // comma-separated permissions
        }

        [HttpPut("roles/{id}/permisos")]
        public IActionResult UpdateRolPermisos(int id, [FromBody] UpdatePermisosDto dto)
        {
            var rol = _context.Roles.FirstOrDefault(r => r.Id == id);
            if (rol == null) return NotFound(new { message = "Rol no encontrado." });

            rol.Permisos = dto.Permisos;
            _context.SaveChanges();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            _context.AuditoriaLogs.Add(new AuditoriaLog
            {
                UsuarioId = GetCurrentUserId() ?? 1,
                Accion = "Modificar Permisos de Rol",
                Modulo = "Gestión de Usuarios",
                Detalles = $"Permisos del rol '{rol.Nombre}' actualizados",
                IP = ip,
                Computadora = Request.Headers["User-Agent"].ToString().Length > 100
                    ? Request.Headers["User-Agent"].ToString()[..100]
                    : Request.Headers["User-Agent"].ToString()
            });
            _context.SaveChanges();

            return Ok(new { message = $"Permisos del rol '{rol.Nombre}' actualizados.", rol });
        }

        [HttpGet("roles/{id}/permisos")]
        public IActionResult GetRolPermisos(int id)
        {
            var rol = _context.Roles.FirstOrDefault(r => r.Id == id);
            if (rol == null) return NotFound(new { message = "Rol no encontrado." });
            var permisosList = rol.Permisos.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(p => p.Trim()).ToList();
            return Ok(new { rolId = rol.Id, nombre = rol.Nombre, permisos = permisosList });
        }

        [HttpGet("{id}/permisos")]
        public IActionResult GetUsuarioPermisos(int id)
        {
            var user = _context.Usuarios.FirstOrDefault(u => u.Id == id);
            if (user == null) return NotFound(new { message = "Usuario no encontrado." });
            
            var permisos = string.IsNullOrWhiteSpace(user.Permisos) 
                ? (_context.Roles.FirstOrDefault(r => r.Id == user.RolId)?.Permisos ?? "")
                : user.Permisos;

            var permisosList = permisos.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(p => p.Trim()).ToList();
            return Ok(new { usuarioId = user.Id, username = user.Username, permisos = permisosList });
        }

        [HttpPut("{id}/permisos")]
        public IActionResult UpdateUsuarioPermisos(int id, [FromBody] UpdatePermisosDto dto)
        {
            var user = _context.Usuarios.FirstOrDefault(u => u.Id == id);
            if (user == null) return NotFound(new { message = "Usuario no encontrado." });

            user.Permisos = dto.Permisos;
            _context.SaveChanges();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            _context.AuditoriaLogs.Add(new AuditoriaLog
            {
                UsuarioId = GetCurrentUserId() ?? 1,
                Accion = "Modificar Permisos de Usuario",
                Modulo = "Gestión de Usuarios",
                Detalles = $"Permisos del usuario '{user.Username}' actualizados directamente",
                IP = ip,
                Computadora = Request.Headers["User-Agent"].ToString().Length > 100
                    ? Request.Headers["User-Agent"].ToString()[..100]
                    : Request.Headers["User-Agent"].ToString()
            });
            _context.SaveChanges();

            return Ok(new { message = $"Permisos del usuario '{user.Username}' actualizados.", user });
        }

        public class UpdateProyectoDto
        {
            public List<int>? ProyectoIds { get; set; }
            public int? AreaId { get; set; }
        }
    }
}
