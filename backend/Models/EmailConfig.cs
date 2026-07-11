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
    }
}
