using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sigecosem.WebApi.Data;
using Sigecosem.WebApi.Models;
using System.Text;

namespace Sigecosem.WebApi.Services
{
    public class ReporteDiarioService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ReporteDiarioService> _logger;
        private readonly EmailConfig _emailConfig;

        public ReporteDiarioService(
            IServiceScopeFactory scopeFactory,
            ILogger<ReporteDiarioService> logger,
            IOptions<EmailConfig> emailConfig)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _emailConfig = emailConfig.Value;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Servicio de Reporte Diario iniciado. Hora programada: {Hora}", _emailConfig.HoraEnvioAutomatico);

            while (!stoppingToken.IsCancellationRequested)
            {
                if (!_emailConfig.EnvioAutomaticoActivo)
                {
                    await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
                    continue;
                }

                var ahora = DateTime.Now;
                var horaObjetivo = ParseHora(_emailConfig.HoraEnvioAutomatico);
                var envioHoy = new DateTime(ahora.Year, ahora.Month, ahora.Day, horaObjetivo.Hours, horaObjetivo.Minutes, 0);

                var espera = envioHoy > ahora ? envioHoy - ahora : envioHoy.AddDays(1) - ahora;

                _logger.LogInformation("Próximo reporte diario en: {Espera}", espera);

                try
                {
                    await Task.Delay(espera, stoppingToken);
                }
                catch (TaskCanceledException) { break; }

                if (!stoppingToken.IsCancellationRequested)
                    await EnviarReporteDiarioAsync();
            }
        }

        private static TimeSpan ParseHora(string hora)
        {
            if (TimeSpan.TryParse(hora, out var ts)) return ts;
            return new TimeSpan(18, 0, 0); // default 18:00
        }

        private async Task EnviarReporteDiarioAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                var hoy = DateTime.UtcNow.Date;
                var maniana = hoy.AddDays(1);

                // Obtener datos del día
                var checklistsHoy = await context.CheckLists
                    .Include(c => c.Equipo)
                    .Include(c => c.Operador)
                    .Include(c => c.Proyecto)
                    .Where(c => c.FechaHora >= hoy && c.FechaHora < maniana)
                    .ToListAsync();

                var tareosHoy = await context.Tareos
                    .Include(t => t.Equipo)
                    .Include(t => t.Operador)
                    .Include(t => t.Proyecto)
                    .Where(t => t.Fecha >= hoy && t.Fecha < maniana)
                    .ToListAsync();

                var combustiblesHoy = await context.Combustibles
                    .Include(c => c.Equipo)
                    .Include(c => c.Operador)
                    .Include(c => c.Proyecto)
                    .Where(c => c.Fecha >= hoy && c.Fecha < maniana)
                    .ToListAsync();

                var mantenimientosHoy = await context.Mantenimientos
                    .Include(m => m.Equipo)
                    .Where(m => m.Fecha >= hoy && m.Fecha < maniana)
                    .ToListAsync();

                // Alertas activas (SOAT/Revisión Técnica próximos a vencer)
                var equiposConAlerta = await context.Equipos
                    .Where(e => (e.SOATVencimiento.HasValue && e.SOATVencimiento.Value <= DateTime.UtcNow.AddDays(30)) ||
                                (e.RevisionTecnicaVencimiento.HasValue && e.RevisionTecnicaVencimiento.Value <= DateTime.UtcNow.AddDays(30)))
                    .ToListAsync();

                var html = GenerarHtmlResumenDiario(
                    checklistsHoy, tareosHoy, combustiblesHoy, mantenimientosHoy, equiposConAlerta, hoy);

                var destinatarios = _emailConfig.DestinatariosAutomaticos
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(d => d.Trim())
                    .ToList();

                var asunto = $"[SIGECOSEM] Resumen Diario de Operaciones — {hoy:dd/MM/yyyy}";

                var resultado = await emailService.EnviarReporteAsync(destinatarios, asunto, html, new List<EmailAttachment>());
                _logger.LogInformation("Reporte diario enviado: {Resultado} a {Destinatarios}", resultado, string.Join(", ", destinatarios));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar reporte diario automático");
            }
        }

        private static string GenerarHtmlResumenDiario(
            List<CheckList> checklists,
            List<Tareo> tareos,
            List<Combustible> combustibles,
            List<Mantenimiento> mantenimientos,
            List<Equipo> equiposAlerta,
            DateTime fecha)
        {
            var totalHoras = tareos.Sum(t => t.HorasNormales + t.HorasExtras);
            var totalCombustible = combustibles.Sum(c => c.CostoTotal);
            var totalMantenimiento = mantenimientos.Sum(m => m.CostoTotal);
            var fallasCriticas = checklists.Count(c => c.TieneFallasCriticas);

            var sb = new StringBuilder();
            sb.Append($@"<!DOCTYPE html>
<html lang='es'>
<head><meta charset='UTF-8'>
<style>
  body {{ font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; color: #333; }}
  .container {{ max-width: 800px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
  .header {{ background: linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%); color: white; padding: 28px 32px; }}
  .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; }}
  .header p {{ margin: 4px 0 0; font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 2px; }}
  .kpi-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 24px 32px; background: #f9fafb; }}
  .kpi {{ background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; text-align: center; }}
  .kpi-value {{ font-size: 28px; font-weight: 800; color: #1e3a5f; }}
  .kpi-label {{ font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }}
  .section {{ padding: 20px 32px; border-top: 1px solid #e5e7eb; }}
  .section-title {{ font-size: 13px; font-weight: 800; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 12px; }}
  th {{ background: #1e3a5f; color: white; padding: 8px 12px; text-align: left; font-size: 11px; }}
  td {{ padding: 7px 12px; border-bottom: 1px solid #e5e7eb; }}
  tr:nth-child(even) td {{ background: #f9fafb; }}
  .badge {{ display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }}
  .badge-green {{ background: #d1fae5; color: #065f46; }}
  .badge-red {{ background: #fee2e2; color: #991b1b; }}
  .badge-yellow {{ background: #fef3c7; color: #92400e; }}
  .alerta-box {{ background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; font-size: 12px; }}
  .footer {{ background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 14px 32px; font-size: 11px; color: #9ca3af; text-align: center; }}
</style></head>
<body><div class='container'>
<div class='header'>
  <h1>EMPRESA COMUNAL DE SERVICIOS MÚLTIPLES</h1>
  <p>ECOSEM PUCARA-MOROCOCHA · Resumen Diario Automatizado</p>
  <p style='margin-top:8px;font-size:16px;font-weight:800;opacity:1;'>📋 Operaciones del {fecha:dd MMMM yyyy}</p>
</div>
<div class='kpi-grid'>
  <div class='kpi'><div class='kpi-value'>{checklists.Count}</div><div class='kpi-label'>Checklists</div></div>
  <div class='kpi'><div class='kpi-value'>{tareos.Count}</div><div class='kpi-label'>Tareos</div></div>
  <div class='kpi'><div class='kpi-value'>{totalHoras:F1}h</div><div class='kpi-label'>Horas Totales</div></div>
  <div class='kpi'><div class='kpi-value' style='color:{(fallasCriticas > 0 ? "#dc2626" : "#16a34a")};'>{fallasCriticas}</div><div class='kpi-label'>Fallas Críticas</div></div>
</div>");

            // Checklists
            if (checklists.Count > 0)
            {
                sb.Append("<div class='section'><p class='section-title'>✅ Checklists Pre-Operacionales</p><table><tr><th>Equipo</th><th>Tipo</th><th>Operador</th><th>Proyecto</th><th>Estado</th><th>Fallas</th></tr>");
                foreach (var c in checklists)
                {
                    var estadoBadge = c.Estado == "Aprobado" ? "badge-green" : (c.Estado == "Rechazado" ? "badge-red" : "badge-yellow");
                    var fallas = c.TieneFallasCriticas ? "<span class='badge badge-red'>SÍ</span>" : "<span class='badge badge-green'>NO</span>";
                    sb.Append($"<tr><td>{c.EquipoPlaca}</td><td>{c.Equipo?.Tipo ?? "N/A"}</td><td>{c.Operador?.Nombre} {c.Operador?.Apellido}</td><td>{c.Proyecto?.Nombre ?? "—"}</td><td><span class='badge {estadoBadge}'>{c.Estado}</span></td><td>{fallas}</td></tr>");
                }
                sb.Append("</table></div>");
            }

            // Tareos
            if (tareos.Count > 0)
            {
                sb.Append("<div class='section'><p class='section-title'>⏱️ Tareos y Horas Trabajadas</p><table><tr><th>Equipo</th><th>Operador</th><th>Actividad</th><th>Proyecto</th><th>H.Normales</th><th>H.Extras</th><th>Total</th></tr>");
                foreach (var t in tareos)
                {
                    sb.Append($"<tr><td>{t.EquipoPlaca}</td><td>{t.Operador?.Nombre} {t.Operador?.Apellido}</td><td>{t.Actividad}</td><td>{t.Proyecto?.Nombre ?? "—"}</td><td>{t.HorasNormales:F1}</td><td>{t.HorasExtras:F1}</td><td><strong>{t.HorasNormales + t.HorasExtras:F1}</strong></td></tr>");
                }
                sb.Append($"<tr style='background:#1e3a5f;color:white;'><td colspan='6'><strong>TOTAL HORAS DEL DÍA</strong></td><td><strong>{totalHoras:F1} hrs</strong></td></tr>");
                sb.Append("</table></div>");
            }

            // Combustibles
            if (combustibles.Count > 0)
            {
                sb.Append($"<div class='section'><p class='section-title'>⛽ Abastecimiento de Combustible</p><table><tr><th>Equipo</th><th>Tipo</th><th>Grifo</th><th>Galones</th><th>Costo</th></tr>");
                foreach (var c in combustibles)
                    sb.Append($"<tr><td>{c.EquipoPlaca}</td><td>{c.Equipo?.Tipo ?? "N/A"}</td><td>{c.Grifo}</td><td>{c.Galones} gl</td><td>S/ {c.CostoTotal:F2}</td></tr>");
                sb.Append($"<tr style='background:#1e3a5f;color:white;'><td colspan='4'><strong>TOTAL COMBUSTIBLE</strong></td><td><strong>S/ {totalCombustible:F2}</strong></td></tr>");
                sb.Append("</table></div>");
            }

            // Mantenimientos
            if (mantenimientos.Count > 0)
            {
                sb.Append($"<div class='section'><p class='section-title'>🔧 Mantenimientos Registrados</p><table><tr><th>Equipo</th><th>Tipo</th><th>Descripción</th><th>Responsable</th><th>Costo</th></tr>");
                foreach (var m in mantenimientos)
                    sb.Append($"<tr><td>{m.EquipoPlaca}</td><td>{m.Tipo}</td><td>{m.Descripcion[..Math.Min(60, m.Descripcion.Length)]}…</td><td>{m.Responsable}</td><td>S/ {m.CostoTotal:F2}</td></tr>");
                sb.Append("</table></div>");
            }

            // Alertas SOAT
            if (equiposAlerta.Count > 0)
            {
                sb.Append("<div class='section'><p class='section-title'>⚠️ Documentos Próximos a Vencer (30 días)</p>");
                foreach (var e in equiposAlerta)
                {
                    if (e.SOATVencimiento.HasValue && e.SOATVencimiento.Value <= DateTime.UtcNow.AddDays(30))
                        sb.Append($"<div class='alerta-box'>⚠️ <strong>{e.Placa} ({e.Tipo})</strong> — SOAT vence el <strong>{e.SOATVencimiento:dd/MM/yyyy}</strong></div>");
                    if (e.RevisionTecnicaVencimiento.HasValue && e.RevisionTecnicaVencimiento.Value <= DateTime.UtcNow.AddDays(30))
                        sb.Append($"<div class='alerta-box'>⚠️ <strong>{e.Placa} ({e.Tipo})</strong> — Revisión Técnica vence el <strong>{e.RevisionTecnicaVencimiento:dd/MM/yyyy}</strong></div>");
                }
                sb.Append("</div>");
            }

            sb.Append($"<div class='footer'><p>Reporte generado automáticamente por <strong>SIGECOSEM</strong> · {DateTime.Now:dd/MM/yyyy HH:mm} · Ecosem Pucara, Junín - Perú</p></div></div></body></html>");
            return sb.ToString();
        }
    }
}
