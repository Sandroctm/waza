using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using Sigecosem.WebApi.Models;

namespace Sigecosem.WebApi.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailConfig _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailConfig> config, ILogger<EmailService> logger)
        {
            _config = config.Value;
            _logger = logger;
        }

        public async Task<bool> EnviarReporteAsync(
            List<string> destinatarios,
            string asunto,
            string cuerpoHtml,
            List<EmailAttachment> adjuntos)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_config.NombreRemitente, _config.Usuario));

                // Siempre incluir el correo fijo
                var todosDestinatarios = new List<string>(destinatarios);
                if (!string.IsNullOrWhiteSpace(_config.CorreoFijo) && !todosDestinatarios.Contains(_config.CorreoFijo, StringComparer.OrdinalIgnoreCase))
                {
                    todosDestinatarios.Add(_config.CorreoFijo);
                }

                foreach (var email in todosDestinatarios)
                {
                    if (!string.IsNullOrWhiteSpace(email))
                        message.To.Add(MailboxAddress.Parse(email));
                }

                message.Subject = asunto;

                var builder = new BodyBuilder { HtmlBody = cuerpoHtml };

                // Adjuntar archivos (PDF, imágenes)
                foreach (var adjunto in adjuntos)
                {
                    builder.Attachments.Add(adjunto.FileName, adjunto.Content, ContentType.Parse(adjunto.ContentType));
                }

                message.Body = builder.ToMessageBody();

                using var client = new SmtpClient();
                await client.ConnectAsync(_config.SmtpHost, _config.SmtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_config.Usuario, _config.Password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Correo enviado a: {Destinatarios}", string.Join(", ", todosDestinatarios));
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enviando correo de reporte");
                return false;
            }
        }
    }
}
