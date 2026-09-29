namespace Sigecosem.WebApi.Models
{
    public class EmailConfig
    {
        public string SmtpHost { get; set; } = "smtp.gmail.com";
        public int SmtpPort { get; set; } = 587;
        public string Usuario { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string NombreRemitente { get; set; } = "Sigecosem - Reportes";
        public string CorreoFijo { get; set; } = "transportes@ecosem.pe";
        // Destinatarios para reporte diario automático (separados por coma)
        public string DestinatariosAutomaticos { get; set; } = "transportes@ecosem.pe";
        // Hora de envío automático (formato HH:mm, por defecto 18:00)
        public string HoraEnvioAutomatico { get; set; } = "18:00";
        public bool EnvioAutomaticoActivo { get; set; } = true;
    }
}
