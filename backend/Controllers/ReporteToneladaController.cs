using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sigecosem.WebApi.Data;
using Sigecosem.WebApi.Models;
using ClosedXML.Excel;

namespace Sigecosem.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReporteToneladaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReporteToneladaController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetReportes(
            [FromQuery] string? startDate,
            [FromQuery] string? endDate,
            [FromQuery] string? codBalanza,
            [FromQuery] string? descMat,
            [FromQuery] string? centroOrigen)
        {
            var query = _context.ReportesTonelada.AsQueryable();

            if (DateTime.TryParse(startDate, out var start))
            {
                query = query.Where(r => r.Fecha >= start.Date);
            }
            
            if (DateTime.TryParse(endDate, out var end))
            {
                query = query.Where(r => r.Fecha <= end.Date.AddDays(1).AddTicks(-1));
            }

            if (!string.IsNullOrWhiteSpace(codBalanza) && codBalanza != "(Todas)")
            {
                query = query.Where(r => r.CodBalanza.ToLower().Contains(codBalanza.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(descMat) && descMat != "(Todas)")
            {
                query = query.Where(r => r.DescMat.ToLower().Contains(descMat.ToLower()) || r.TipoMaterial.ToLower().Contains(descMat.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(centroOrigen) && centroOrigen != "(Todas)")
            {
                query = query.Where(r => r.CentroOrigen.ToLower().Contains(centroOrigen.ToLower()) || r.EmpresaContratista.ToLower().Contains(centroOrigen.ToLower()));
            }

            var reportes = await query.OrderByDescending(r => r.Fecha).ToListAsync();
            return Ok(reportes);
        }

        [HttpPost]
        public async Task<IActionResult> CreateReporte([FromBody] ReporteTonelada reporte)
        {
            if (string.IsNullOrWhiteSpace(reporte.CodBalanza)) reporte.CodBalanza = "(Todas)";
            if (string.IsNullOrWhiteSpace(reporte.DescMat)) reporte.DescMat = string.IsNullOrWhiteSpace(reporte.TipoMaterial) ? "Mineral" : reporte.TipoMaterial;
            if (string.IsNullOrWhiteSpace(reporte.CentroOrigen)) reporte.CentroOrigen = string.IsNullOrWhiteSpace(reporte.EmpresaContratista) ? "PUCARA" : reporte.EmpresaContratista;
            if (string.IsNullOrWhiteSpace(reporte.DescRuta)) reporte.DescRuta = string.IsNullOrWhiteSpace(reporte.Ruta) ? "MTIC - C. 6" : reporte.Ruta;

            // Compute PesoNeto and TMS if missing
            if (reporte.PesoNeto <= 0 && reporte.PesoBruto > reporte.Tara)
            {
                reporte.PesoNeto = reporte.PesoBruto - reporte.Tara;
            }
            if (reporte.Tms <= 0 && reporte.PesoNeto > 0)
            {
                var factorHumedad = (100m - reporte.Humedad) / 100m;
                reporte.Tms = Math.Round(reporte.PesoNeto * factorHumedad, 4);
            }

            _context.ReportesTonelada.Add(reporte);
            await _context.SaveChangesAsync();

            // Store in Excel database replica
            try
            {
                Sigecosem.WebApi.Helpers.ExcelDbHelper.AppendReporteTonelada(
                    reporte.Placa,
                    reporte.Conductor,
                    reporte.EmpresaContratista,
                    reporte.TipoMaterial,
                    reporte.Ruta,
                    reporte.PesoBruto,
                    reporte.Tara,
                    reporte.PesoNeto,
                    reporte.Humedad,
                    reporte.Tms,
                    reporte.Observaciones
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed to append tonnages to excel: " + ex.Message);
            }

            return Ok(reporte);
        }

        [HttpGet("exportar-excel")]
        [AllowAnonymous]
        public async Task<IActionResult> ExportarExcel(
            [FromQuery] string? startDate,
            [FromQuery] string? endDate,
            [FromQuery] string? codBalanza,
            [FromQuery] string? descMat,
            [FromQuery] string? centroOrigen)
        {
            var query = _context.ReportesTonelada.AsQueryable();

            if (DateTime.TryParse(startDate, out var start))
            {
                query = query.Where(r => r.Fecha >= start.Date);
            }
            if (DateTime.TryParse(endDate, out var end))
            {
                query = query.Where(r => r.Fecha <= end.Date.AddDays(1).AddTicks(-1));
            }
            if (!string.IsNullOrWhiteSpace(codBalanza) && codBalanza != "(Todas)")
            {
                query = query.Where(r => r.CodBalanza.ToLower().Contains(codBalanza.ToLower()));
            }
            if (!string.IsNullOrWhiteSpace(descMat) && descMat != "(Todas)")
            {
                query = query.Where(r => r.DescMat.ToLower().Contains(descMat.ToLower()) || r.TipoMaterial.ToLower().Contains(descMat.ToLower()));
            }
            if (!string.IsNullOrWhiteSpace(centroOrigen) && centroOrigen != "(Todas)")
            {
                query = query.Where(r => r.CentroOrigen.ToLower().Contains(centroOrigen.ToLower()) || r.EmpresaContratista.ToLower().Contains(centroOrigen.ToLower()));
            }

            var reportes = await query.OrderByDescending(r => r.Fecha).ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Detalle Viajes");

            // Header Title matching attached image
            worksheet.Cell("B1").Value = "DETALLE DE VIAJES POR CONTRATISTA";
            worksheet.Cell("B1").Style.Font.Bold = true;
            worksheet.Cell("B1").Style.Font.FontSize = 13;

            // Filter metadata block matching attached image layout
            worksheet.Cell("A3").Value = "CODBALANZ";
            worksheet.Cell("B3").Value = string.IsNullOrWhiteSpace(codBalanza) ? "(Todas)" : codBalanza;
            worksheet.Cell("D3").Value = "DESDE :";
            worksheet.Cell("E3").Value = string.IsNullOrWhiteSpace(startDate) ? DateTime.Now.ToString("dd/MM/yyyy") : startDate;

            worksheet.Cell("A4").Value = "DESCMAT";
            worksheet.Cell("B4").Value = string.IsNullOrWhiteSpace(descMat) ? "(Todas)" : descMat;
            worksheet.Cell("D4").Value = "HASTA :";
            worksheet.Cell("E4").Value = string.IsNullOrWhiteSpace(endDate) ? DateTime.Now.ToString("dd/MM/yyyy") : endDate;

            worksheet.Cell("A5").Value = "CENTROOR";
            worksheet.Cell("B5").Value = string.IsNullOrWhiteSpace(centroOrigen) ? "(Todas)" : centroOrigen;

            worksheet.Range("A3:A5").Style.Font.Bold = true;
            worksheet.Range("D3:D4").Style.Font.Bold = true;

            // Section subtitle
            worksheet.Cell("G6").Value = "Datos";
            worksheet.Cell("G6").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Column Headers matching attached image (Row 7)
            string[] headers = {
                "DESCRUTA",
                "FECHASALID",
                "REG_PESAJE",
                "VEHICULO",
                "RUTA",
                "w",
                "OBSERVACI",
                "'PESOENTRA",
                "'PESOSALID",
                "'PESONETO",
                "'TMS_SECAS"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(7, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontSize = 10;
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                
                // Highlight 'PESONETO column header in vibrant yellow (#FFFF00) as in image!
                if (headers[i] == "'PESONETO" || headers[i] == "PESONETO")
                {
                    cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#FFFF00");
                }
                else
                {
                    cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#F2F2F2");
                }
            }

            // Data rows starting from Row 8
            int row = 8;
            foreach (var r in reportes)
            {
                worksheet.Cell(row, 1).Value = string.IsNullOrWhiteSpace(r.DescRuta) ? (string.IsNullOrWhiteSpace(r.Ruta) ? "MTIC - C. 6" : r.Ruta) : r.DescRuta;
                worksheet.Cell(row, 2).Value = r.Fecha.ToString("dd/MM/yyyy");
                worksheet.Cell(row, 3).Value = string.IsNullOrWhiteSpace(r.RegPesaje) ? (10699000 + r.Id).ToString() : r.RegPesaje;
                worksheet.Cell(row, 4).Value = r.Placa;
                worksheet.Cell(row, 5).Value = string.IsNullOrWhiteSpace(r.Ruta) ? "3000120" : r.Ruta;
                worksheet.Cell(row, 6).Value = string.IsNullOrWhiteSpace(r.CentroOrigen) ? (string.IsNullOrWhiteSpace(r.EmpresaContratista) ? "PUCARA" : r.EmpresaContratista) : r.CentroOrigen;
                worksheet.Cell(row, 7).Value = string.IsNullOrWhiteSpace(r.Observaciones) ? "T010-0002" : r.Observaciones;
                worksheet.Cell(row, 8).Value = r.PesoBruto;
                worksheet.Cell(row, 9).Value = r.Tara;
                
                // Column 10: PESONETO highlighted in bright yellow (#FFFF00) as in attached image!
                var pesoNetoCell = worksheet.Cell(row, 10);
                pesoNetoCell.Value = r.PesoNeto;
                pesoNetoCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#FFFF00");
                pesoNetoCell.Style.Font.Bold = true;

                worksheet.Cell(row, 11).Value = r.Tms;

                for (int col = 1; col <= 11; col++)
                {
                    worksheet.Cell(row, col).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    worksheet.Cell(row, col).Style.Font.FontSize = 10;
                }

                row++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Detalle_Viajes_Contratista_{DateTime.Now:yyyyMMdd_HHmm}.xlsx"
            );
        }
    }
}
