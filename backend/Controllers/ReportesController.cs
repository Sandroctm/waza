using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sigecosem.WebApi.Data;
using Sigecosem.WebApi.Models;
using Sigecosem.WebApi.Services;
using System.Text;
using System.Text.Json;

namespace Sigecosem.WebApi.Controllers
{
    public class EnviarEmailRequest
    {
        public string TipoReporte { get; set; } = string.Empty; // checklist, tareo, combustible, mantenimiento
        public int RegistroId { get; set; }
        public List<string> Destinatarios { get; set; } = new();
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public ReportesController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpPost("enviar-email")]
        public async Task<IActionResult> EnviarEmail([FromBody] EnviarEmailRequest request)
        {
            try
            {
                string asunto = string.Empty;
                string htmlCuerpo = string.Empty;
                var adjuntos = new List<EmailAttachment>();

                switch (request.TipoReporte.ToLower())
                {
                    case "checklist":
                        var checklist = await _context.CheckLists
                            .Include(c => c.Equipo)
                            .Include(c => c.Operador)
                            .Include(c => c.Supervisor)
                            .Include(c => c.Proyecto)
                            .Include(c => c.Area)
                            .FirstOrDefaultAsync(c => c.Id == request.RegistroId);

                        if (checklist == null) return NotFound(new { message = "Checklist no encontrado." });

                        asunto = $"[Sigecosem] Checklist Pre-operacional - {checklist.EquipoPlaca} - {checklist.FechaHora:dd/MM/yyyy}";
                        htmlCuerpo = GenerarHtmlChecklist(checklist);

                        // Adjuntar foto del checklist si existe
                        if (!string.IsNullOrEmpty(checklist.FotoUrl))
                        {
                            var fotoAdj = await DescargarAdjunto(checklist.FotoUrl, "foto_checklist.jpg");
                            if (fotoAdj != null) adjuntos.Add(fotoAdj);
                        }
                        break;

                    case "tareo":
                        var tareo = await _context.Tareos
                            .Include(t => t.Equipo)
                            .Include(t => t.Operador)
                            .Include(t => t.Proyecto)
                            .Include(t => t.Area)
                            .FirstOrDefaultAsync(t => t.Id == request.RegistroId);

                        if (tareo == null) return NotFound(new { message = "Tareo no encontrado." });

                        asunto = $"[Sigecosem] Control de Tareo - {tareo.EquipoPlaca} - {tareo.Fecha:dd/MM/yyyy}";
                        htmlCuerpo = GenerarHtmlTareo(tareo);
                        break;

                    case "combustible":
                        var combustible = await _context.Combustibles
                            .Include(c => c.Equipo)
                            .Include(c => c.Operador)
                            .Include(c => c.Proyecto)
                            .Include(c => c.Area)
                            .FirstOrDefaultAsync(c => c.Id == request.RegistroId);

                        if (combustible == null) return NotFound(new { message = "Combustible no encontrado." });

                        asunto = $"[Sigecosem] Orden de Combustible - {combustible.EquipoPlaca} - {combustible.Fecha:dd/MM/yyyy}";
                        htmlCuerpo = GenerarHtmlCombustible(combustible);
                        break;

                    case "mantenimiento":
                        var mantenimiento = await _context.Mantenimientos
                            .Include(m => m.Equipo)
                            .FirstOrDefaultAsync(m => m.Id == request.RegistroId);

                        if (mantenimiento == null) return NotFound(new { message = "Mantenimiento no encontrado." });

                        asunto = $"[Sigecosem] Orden de Mantenimiento - {mantenimiento.EquipoPlaca} - {mantenimiento.Fecha:dd/MM/yyyy}";
                        htmlCuerpo = GenerarHtmlMantenimiento(mantenimiento);

                        // Adjuntar factura si existe
                        if (!string.IsNullOrEmpty(mantenimiento.FacturaUrl))
                        {
                            var factAdj = await DescargarAdjunto(mantenimiento.FacturaUrl, "factura.pdf");
                            if (factAdj != null) adjuntos.Add(factAdj);
                        }
                        if (!string.IsNullOrEmpty(mantenimiento.FotoUrl))
                        {
                            var fotoMantAdj = await DescargarAdjunto(mantenimiento.FotoUrl, "foto_mantenimiento.jpg");
                            if (fotoMantAdj != null) adjuntos.Add(fotoMantAdj);
                        }
                        break;

                    default:
                        return BadRequest(new { message = "Tipo de reporte no válido." });
                }

                var resultado = await _emailService.EnviarReporteAsync(request.Destinatarios, asunto, htmlCuerpo, adjuntos);

                if (resultado)
                    return Ok(new { message = "Correo enviado exitosamente a los destinatarios." });
                else
                    return StatusCode(500, new { message = "Error al enviar el correo. Verifique la configuración SMTP." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error interno: {ex.Message}" });
            }
        }

        // --- Descarga archivo adjunto desde URL (puede ser local /uploads/ o externa) ---
        private async Task<EmailAttachment?> DescargarAdjunto(string url, string nombreArchivo)
        {
            try
            {
                if (url.StartsWith("/uploads/"))
                {
                    // Es un archivo local del servidor
                    var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                    var rutaRelativa = url.Replace("/uploads/", "").TrimStart('/');
                    var rutaCompleta = Path.Combine(uploadsPath, rutaRelativa);
                    if (System.IO.File.Exists(rutaCompleta))
                    {
                        var bytes = await System.IO.File.ReadAllBytesAsync(rutaCompleta);
                        var ct = ObtenerContentType(nombreArchivo);
                        return new EmailAttachment { FileName = nombreArchivo, Content = bytes, ContentType = ct };
                    }
                }
                else if (url.StartsWith("http"))
                {
                    // URL externa (DigitalOcean Spaces u otro)
                    using var httpClient = new HttpClient();
                    httpClient.Timeout = TimeSpan.FromSeconds(30);
                    var bytes = await httpClient.GetByteArrayAsync(url);
                    var ext = Path.GetExtension(url).ToLower();
                    var fn = string.IsNullOrEmpty(ext) ? nombreArchivo : Path.GetFileNameWithoutExtension(nombreArchivo) + ext;
                    return new EmailAttachment { FileName = fn, Content = bytes, ContentType = ObtenerContentType(fn) };
                }
            }
            catch (Exception)
            {
                // Si falla la descarga, continuar sin el adjunto
            }
            return null;
        }

        private static string ObtenerContentType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLower();
            return ext switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => "application/octet-stream"
            };
        }

        // ========== HTML TEMPLATES ==========

        private static string WrapHtml(string titulo, string cuerpo) => $@"
<!DOCTYPE html>
<html lang='es'>
<head>
<meta charset='UTF-8'>
<style>
  body {{ font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; color: #333; }}
  .container {{ max-width: 700px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
  .header {{ background: linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%); color: white; padding: 28px 32px; }}
  .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; }}
  .header .subtitle {{ margin: 4px 0 0; font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 2px; }}
  .badge {{ display: inline-block; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }}
  .body {{ padding: 28px 32px; }}
  .section {{ margin-bottom: 24px; }}
  .section-title {{ font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6b7280; letter-spacing: 1.5px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 14px; }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }}
  .field {{ background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; }}
  .field label {{ display: block; font-size: 10px; color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }}
  .field span {{ font-size: 14px; font-weight: 700; color: #111827; }}
  .highlight {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; }}
  .highlight.warning {{ background: #fef3c7; border-color: #fcd34d; }}
  .highlight.danger {{ background: #fef2f2; border-color: #fecaca; }}
  .table {{ width: 100%; border-collapse: collapse; font-size: 12px; }}
  .table th {{ background: #1e3a5f; color: white; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }}
  .table td {{ padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }}
  .table tr:nth-child(even) td {{ background: #f9fafb; }}
  .footer {{ background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 32px; font-size: 11px; color: #9ca3af; text-align: center; }}
  .total-row {{ background: #1e3a5f !important; color: white; font-weight: 800; }}
  .total-row td {{ color: white !important; }}
</style>
</head>
<body>
<div class='container'>
  <div class='header'>
    <h1>EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES</h1>
    <p class='subtitle'>ECOSEM PUCARA-MOROCOCHA · Sistema Integrado de Control de Flota</p>
    <span class='badge'>{titulo}</span>
  </div>
  <div class='body'>
    {cuerpo}
  </div>
  <div class='footer'>
    <p>Este correo fue generado automáticamente por <strong>SIGECOSEM</strong>. No responder a este mensaje.</p>
    <p>Fecha de emisión: {DateTime.Now:dd/MM/yyyy HH:mm} · Ecosem Pucara, Junín - Perú</p>
  </div>
</div>
</body>
</html>";

        private static string GenerarHtmlChecklist(CheckList c)
        {
            var operador = c.Operador != null ? $"{c.Operador.Nombre} {c.Operador.Apellido}" : "No registrado";
            var supervisor = c.Supervisor != null ? $"{c.Supervisor.Nombre} {c.Supervisor.Apellido}" : "Pendiente";
            var estadoBadge = c.Estado == "Aprobado"
                ? "<span style='color:#16a34a;font-weight:800;'>✓ APROBADO</span>"
                : "<span style='color:#dc2626;font-weight:800;'>✗ " + c.Estado + "</span>";

            var cuerpo = $@"
<div class='section'>
  <p class='section-title'>Información del Vehículo</p>
  <div class='grid'>
    <div class='field'><label>Vehículo / Placa</label><span>{c.EquipoPlaca}</span></div>
    <div class='field'><label>Tipo</label><span>{c.Equipo?.Tipo ?? "N/A"}</span></div>
    <div class='field'><label>Operador</label><span>{operador}</span></div>
    <div class='field'><label>Supervisor</label><span>{supervisor}</span></div>
    <div class='field'><label>Fecha y Hora</label><span>{c.FechaHora:dd/MM/yyyy HH:mm}</span></div>
    <div class='field'><label>Nivel de Combustible</label><span>{c.CombustibleNivel}%</span></div>
    <div class='field'><label>Estado Inspección</label><span>{estadoBadge}</span></div>
    <div class='field'><label>Fallas Críticas</label><span style='color:{(c.TieneFallasCriticas ? "#dc2626" : "#16a34a")};font-weight:800;'>{(c.TieneFallasCriticas ? "⚠ SÍ" : "✓ NO")}</span></div>
  </div>
</div>
{(string.IsNullOrEmpty(c.Observaciones) ? "" : $@"
<div class='section'>
  <p class='section-title'>Observaciones del Conductor</p>
  <div class='highlight warning'><em>""{c.Observaciones}""</em></div>
</div>")}";

            return WrapHtml("Checklist Pre-operacional", cuerpo);
        }

        private static string GenerarHtmlTareo(Tareo t)
        {
            var operador = t.Operador != null ? $"{t.Operador.Nombre} {t.Operador.Apellido}" : "No registrado";
            var totalHoras = t.HorasNormales + t.HorasExtras;
            var area = t.Area?.Nombre ?? "N/A";
            var proyecto = t.Proyecto?.Nombre ?? "N/A";
            // Determinar si es Línea Amarilla o Línea Blanca
            var tipoEquipo = t.Equipo?.Tipo?.ToLower() ?? "";
            var esLineaAmarilla = tipoEquipo.Contains("excavadora") || tipoEquipo.Contains("cargador") || 
                                   tipoEquipo.Contains("volquete") || tipoEquipo.Contains("tracto") || 
                                   tipoEquipo.Contains("rodillo") || tipoEquipo.Contains("motoniveladora") ||
                                   tipoEquipo.Contains("retroexcavadora");
            var lineaLabel = esLineaAmarilla ? "LÍNEA AMARILLA" : "LÍNEA BLANCA";
            var lineaColor = esLineaAmarilla ? "#d97706" : "#3b82f6";

            var cuerpo = $@"
<div class='section'>
  <p class='section-title'>Control de Tareo / Horómetro · <span style='color:{lineaColor};font-weight:800;'>{lineaLabel}</span></p>
  <div class='grid'>
    <div class='field'><label>Vehículo / Placa</label><span>{t.EquipoPlaca}</span></div>
    <div class='field'><label>Tipo de Equipo</label><span>{t.Equipo?.Tipo ?? "N/A"}</span></div>
    <div class='field'><label>Propietario / Empresa</label><span>ECOSEM</span></div>
    <div class='field'><label>Operador Asignado</label><span>{operador}</span></div>
    <div class='field'><label>Fecha de Actividad</label><span>{t.Fecha:dd/MM/yyyy}</span></div>
    <div class='field'><label>Turno / Horario</label><span>{t.HoraInicio:hh\:mm} - {t.HoraFin:hh\:mm}</span></div>
    <div class='field'><label>Área / Empresa</label><span>{area}</span></div>
    <div class='field'><label>C.C. Solicitante</label><span>{proyecto}</span></div>
  </div>
</div>
<div class='section'>
  <p class='section-title'>Horas Trabajadas</p>
  <table class='table'>
    <tr><th>Horas Normales</th><th>Horas Extras</th><th>Total Horas Efectivas</th></tr>
    <tr><td>{t.HorasNormales:F2} hrs</td><td>{t.HorasExtras:F2} hrs</td><td><strong>{totalHoras:F2} hrs</strong></td></tr>
  </table>
</div>
<div class='section'>
  <p class='section-title'>Actividad Ejecutada</p>
  <div class='highlight'><strong>{t.Actividad}</strong></div>
</div>
{(string.IsNullOrEmpty(t.Observaciones) ? "" : $@"
<div class='section'>
  <p class='section-title'>Observaciones de Operación</p>
  <div class='highlight warning'><em>""{t.Observaciones}""</em></div>
</div>")}";

            return WrapHtml("Control de Tareo de Unidades", cuerpo);
        }

        private static string GenerarHtmlCombustible(Combustible c)
        {
            var operador = c.Operador != null ? $"{c.Operador.Nombre} {c.Operador.Apellido}" : "No registrado";

            var cuerpo = $@"
<div class='section'>
  <p class='section-title'>Orden de Combustible</p>
  <div class='grid'>
    <div class='field'><label>Vehículo / Placa</label><span>{c.EquipoPlaca}</span></div>
    <div class='field'><label>Tipo de Equipo</label><span>{c.Equipo?.Tipo ?? "N/A"}</span></div>
    <div class='field'><label>Operador Solicitante</label><span>{operador}</span></div>
    <div class='field'><label>Fecha de Abastecimiento</label><span>{c.Fecha:dd/MM/yyyy}</span></div>
    <div class='field'><label>Proveedor</label><span>{c.Proveedor}</span></div>
    <div class='field'><label>Grifo / Estación</label><span>{c.Grifo}</span></div>
    <div class='field'><label>Horómetro / Odómetro</label><span>{c.HorometroVal} Hrs/Km</span></div>
  </div>
</div>
<div class='section'>
  <p class='section-title'>Detalle del Abastecimiento</p>
  <table class='table'>
    <tr><th>Cantidad (Galones)</th><th>Precio por Galón</th><th>Costo Total</th></tr>
    <tr><td><strong>{c.Galones} gl</strong></td><td>S/ {c.PrecioGalon:F2}</td><td style='color:#16a34a;font-weight:800;font-size:16px;'>S/ {c.CostoTotal:F2}</td></tr>
  </table>
</div>";

            return WrapHtml("Orden de Combustible", cuerpo);
        }

        private static string GenerarHtmlMantenimiento(Mantenimiento m)
        {
            var repuestosHtml = new StringBuilder();
            try
            {
                var repuestos = JsonSerializer.Deserialize<List<JsonElement>>(m.Repuestos);
                if (repuestos != null && repuestos.Count > 0)
                {
                    repuestosHtml.Append("<table class='table'><tr><th>Repuesto / Consumible</th><th>Cantidad</th><th>Precio Unitario</th><th>Subtotal</th></tr>");
                    foreach (var rep in repuestos)
                    {
                        var nombre = rep.TryGetProperty("nombre", out var n) ? n.GetString() ?? "" : "";
                        var cantidad = rep.TryGetProperty("cantidad", out var c) ? c.GetDecimal() : 0;
                        var precio = rep.TryGetProperty("precio", out var p) ? p.GetDecimal() : 0;
                        repuestosHtml.Append($"<tr><td>{nombre}</td><td>{cantidad}</td><td>S/ {precio:F2}</td><td>S/ {cantidad * precio:F2}</td></tr>");
                    }
                    repuestosHtml.Append($"<tr class='total-row'><td colspan='3'><strong>COSTO TOTAL</strong></td><td>S/ {m.CostoTotal:F2}</td></tr></table>");
                }
            }
            catch { }

            var cuerpo = $@"
<div class='section'>
  <p class='section-title'>Orden de Mantenimiento · <span style='color:{(m.Tipo == "Preventivo" ? "#0284c7" : "#dc2626")};'>{m.Tipo.ToUpper()}</span></p>
  <div class='grid'>
    <div class='field'><label>Vehículo / Placa</label><span>{m.EquipoPlaca}</span></div>
    <div class='field'><label>Tipo de Equipo</label><span>{m.Equipo?.Tipo ?? "N/A"}</span></div>
    <div class='field'><label>Responsable Técnico</label><span>{m.Responsable}</span></div>
    <div class='field'><label>Fecha de Servicio</label><span>{m.Fecha:dd/MM/yyyy}</span></div>
    <div class='field'><label>Proveedor / Taller</label><span>{(string.IsNullOrEmpty(m.Proveedor) ? "Taller Interno" : m.Proveedor)}</span></div>
    <div class='field'><label>Costo Total</label><span style='color:#dc2626;font-weight:800;'>S/ {m.CostoTotal:F2}</span></div>
  </div>
</div>
<div class='section'>
  <p class='section-title'>Descripción de Trabajos Realizados</p>
  <div class='highlight'>{m.Descripcion}</div>
</div>
{(repuestosHtml.Length > 0 ? $@"<div class='section'><p class='section-title'>Repuestos y Consumibles</p>{repuestosHtml}</div>" : "")}";

            return WrapHtml("Orden de Mantenimiento", cuerpo);
        }
    }
}
