using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Sigecosem.WebApi.Models
{
    public class Rol
    {
        public int Id { get; set; }
        [Required, MaxLength(50)]
        public string Nombre { get; set; } = string.Empty; // e.g. "Gerente", "Planeamiento", "SSOMA"
        public string Permisos { get; set; } = string.Empty; // Comma-separated list of claims/permissions
    }

    public class Area
    {
        public int Id { get; set; }
        [Required, MaxLength(100)]
        public string Nombre { get; set; } = string.Empty; // e.g. "Lodos", "Relleno Sanitario", "Vigilancia"
    }

    public class Proyecto
    {
        public int Id { get; set; }
        [Required, MaxLength(150)]
        public string Nombre { get; set; } = string.Empty;
        [MaxLength(200)]
        public string Ubicacion { get; set; } = string.Empty;
        public bool Activo { get; set; } = true;
    }

    public class Usuario
    {
        public int Id { get; set; }
        [Required, MaxLength(50)]
        public string Username { get; set; } = string.Empty;
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;
        [EmailAddress, MaxLength(100)]
        public string Email { get; set; } = string.Empty;
        [Required, MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;
        [Required, MaxLength(100)]
        public string Apellido { get; set; } = string.Empty;
        public int RolId { get; set; }
        public Rol? Rol { get; set; }
        public int? AreaId { get; set; }
        public Area? Area { get; set; }
        public bool Activo { get; set; } = true;
        public int IntentosFallidos { get; set; }
        public DateTime? BloqueadoHasta { get; set; }
    }

    public class Equipo
    {
        [Key, Required, MaxLength(20)]
        public string Placa { get; set; } = string.Empty;
        [Required, MaxLength(50)]
        public string CodigoInterno { get; set; } = string.Empty;
        [Required, MaxLength(50)]
        public string Tipo { get; set; } = string.Empty; // Volquete, Excavadora, etc.
        [Required, MaxLength(50)]
        public string Marca { get; set; } = string.Empty;
        [Required, MaxLength(50)]
        public string Modelo { get; set; } = string.Empty;
        [MaxLength(100)]
        public string Serie { get; set; } = string.Empty;
        [MaxLength(100)]
        public string Motor { get; set; } = string.Empty;
        [MaxLength(100)]
        public string Chasis { get; set; } = string.Empty;
        [MaxLength(50)]
        public string Color { get; set; } = string.Empty;

        public int? ProyectoId { get; set; }
        public Proyecto? Proyecto { get; set; }
        public int? AreaId { get; set; }
        public Area? Area { get; set; }

        public int? SupervisorId { get; set; }
        [ForeignKey("SupervisorId")]
        public Usuario? Supervisor { get; set; }

        public int? OperadorId { get; set; }
        [ForeignKey("OperadorId")]
        public Usuario? Operador { get; set; }

        [Required, MaxLength(50)]
        public string Estado { get; set; } = "Disponible"; // Disponible, Operativo, Bloqueado por SSOMA, etc.

        public DateTime? FechaCompra { get; set; }
        public decimal Valor { get; set; }
        [MaxLength(100)]
        public string Seguro { get; set; } = string.Empty;
        public DateTime? SOATVencimiento { get; set; }
        public DateTime? RevisionTecnicaVencimiento { get; set; }
        public string FotoUrl { get; set; } = string.Empty;
        public string GPSId { get; set; } = string.Empty;
    }

    public class CheckList
    {
        public int Id { get; set; }
        [Required, MaxLength(20)]
        public string EquipoPlaca { get; set; } = string.Empty;
        public Equipo? Equipo { get; set; }
        public DateTime FechaHora { get; set; } = DateTime.UtcNow;
        public int Semana { get; set; }
        public int Mes { get; set; }
        public int Anio { get; set; }

        public int OperadorId { get; set; }
        [ForeignKey("OperadorId")]
        public Usuario? Operador { get; set; }

        public int? SupervisorId { get; set; }
        [ForeignKey("SupervisorId")]
        public Usuario? Supervisor { get; set; }

        public int? ProyectoId { get; set; }
        public Proyecto? Proyecto { get; set; }

        public int? AreaId { get; set; }
        public Area? Area { get; set; }

        public decimal CombustibleNivel { get; set; }
        public string FotoUrl { get; set; } = string.Empty;
        public string Observaciones { get; set; } = string.Empty;
        public bool TieneFallasCriticas { get; set; }
        [Required, MaxLength(50)]
        public string Estado { get; set; } = "Pendiente"; // Aprobado, Rechazado, Corregido
        public string FirmaOperador { get; set; } = string.Empty; // Base64 string
        public string FirmaSupervisor { get; set; } = string.Empty; // Base64 string

        [Column(TypeName = "jsonb")]
        public string ItemsJson { get; set; } = "{}"; // JSON string detailing components status
    }

    public class Tareo
    {
        public int Id { get; set; }
        [Required, MaxLength(20)]
        public string EquipoPlaca { get; set; } = string.Empty;
        public Equipo? Equipo { get; set; }
        public int OperadorId { get; set; }
        [ForeignKey("OperadorId")]
        public Usuario? Operador { get; set; }
        [Required, MaxLength(150)]
        public string Actividad { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
        public decimal HorasNormales { get; set; }
        public decimal HorasExtras { get; set; }
        public int? ProyectoId { get; set; }
        public Proyecto? Proyecto { get; set; }
        public int? AreaId { get; set; }
        public Area? Area { get; set; }
        public string Observaciones { get; set; } = string.Empty;
    }

    public class Horometro
    {
        public int Id { get; set; }
        [Required, MaxLength(20)]
        public string EquipoPlaca { get; set; } = string.Empty;
        public Equipo? Equipo { get; set; }
        public DateTime Fecha { get; set; }
        public decimal Inicial { get; set; }
        public decimal Final { get; set; }
        public decimal HorasTrabajadas { get; set; }
        public decimal ProximoMantenimiento { get; set; } // Odometer or hourmeter count for next service
    }

    public class Combustible
    {
        public int Id { get; set; }
        [Required, MaxLength(20)]
        public string EquipoPlaca { get; set; } = string.Empty;
        public Equipo? Equipo { get; set; }
        [Required, MaxLength(100)]
        public string Proveedor { get; set; } = string.Empty;
        [Required, MaxLength(100)]
        public string Grifo { get; set; } = string.Empty;
        public decimal Galones { get; set; }
        public decimal PrecioGalon { get; set; }
        public decimal CostoTotal { get; set; }
        public decimal HorometroVal { get; set; }
        public int OperadorId { get; set; }
        [ForeignKey("OperadorId")]
        public Usuario? Operador { get; set; }
        public int? ProyectoId { get; set; }
        public Proyecto? Proyecto { get; set; }
        public int? AreaId { get; set; }
        public Area? Area { get; set; }
        public DateTime Fecha { get; set; }
    }

    public class Mantenimiento
    {
        public int Id { get; set; }
        [Required, MaxLength(20)]
        public string EquipoPlaca { get; set; } = string.Empty;
        public Equipo? Equipo { get; set; }
        [Required, MaxLength(50)]
        public string Tipo { get; set; } = "Preventivo"; // Preventivo, Correctivo
        [Required]
        public string Descripcion { get; set; } = string.Empty;
        [Column(TypeName = "jsonb")]
        public string Repuestos { get; set; } = "[]"; // JSON detailing parts used & costs
        public decimal CostoTotal { get; set; }
        [MaxLength(100)]
        public string Proveedor { get; set; } = string.Empty;
        [MaxLength(100)]
        public string Responsable { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public string FacturaUrl { get; set; } = string.Empty;
        public string FotoUrl { get; set; } = string.Empty;
    }

    public class Documento
    {
        public int Id { get; set; }
        [Required, MaxLength(20)]
        public string EquipoPlaca { get; set; } = string.Empty;
        public Equipo? Equipo { get; set; }
        [Required, MaxLength(150)]
        public string Nombre { get; set; } = string.Empty;
        [Required, MaxLength(50)]
        public string Tipo { get; set; } = string.Empty; // SOAT, Revision Tecnica, Licencia, Factura, Cotizacion
        [Required]
        public string Url { get; set; } = string.Empty;
        public DateTime? FechaVencimiento { get; set; }
        public DateTime FechaSubida { get; set; } = DateTime.UtcNow;
    }

    public class Alerta
    {
        public int Id { get; set; }
        [Required, MaxLength(20)]
        public string EquipoPlaca { get; set; } = string.Empty;
        public Equipo? Equipo { get; set; }
        [Required, MaxLength(100)]
        public string Tipo { get; set; } = string.Empty; // ChecklistFaltante, VencimientoSOAT, etc.
        [Required]
        public string Mensaje { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public bool Resuelta { get; set; }
        public int? ResueltaPorId { get; set; }
        [ForeignKey("ResueltaPorId")]
        public Usuario? ResueltaPor { get; set; }
        public DateTime? FechaResolucion { get; set; }
    }

    public class GpsData
    {
        public int Id { get; set; }
        [Required, MaxLength(20)]
        public string EquipoPlaca { get; set; } = string.Empty;
        public Equipo? Equipo { get; set; }
        public decimal Latitud { get; set; }
        public decimal Longitud { get; set; }
        public decimal Velocidad { get; set; }
        public int TiempoDetenidoMinutos { get; set; }
        public DateTime UltimaActualizacion { get; set; } = DateTime.UtcNow;
        public bool MotorEncendido { get; set; }
    }

    public class AuditoriaLog
    {
        public int Id { get; set; }
        public int? UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }
        [Required, MaxLength(150)]
        public string Accion { get; set; } = string.Empty;
        [Required, MaxLength(100)]
        public string Modulo { get; set; } = string.Empty;
        public string Detalles { get; set; } = string.Empty;
        [MaxLength(45)]
        public string IP { get; set; } = string.Empty;
        [MaxLength(100)]
        public string Computadora { get; set; } = string.Empty;
        public DateTime FechaHora { get; set; } = DateTime.UtcNow;
    }
}
