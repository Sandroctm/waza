namespace Sigecosem.WebApi.Services
{
    public class EmailAttachment
    {
        public string FileName { get; set; } = string.Empty;
        public byte[] Content { get; set; } = Array.Empty<byte>();
        public string ContentType { get; set; } = "application/octet-stream";
    }

    public interface IEmailService
    {
        Task<bool> EnviarReporteAsync(
            List<string> destinatarios,
            string asunto,
            string cuerpoHtml,
            List<EmailAttachment> adjuntos
        );
    }
}
