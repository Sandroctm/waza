using System;
using System.IO;
using System.Linq;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Sigecosem.WebApi.Models;

namespace Sigecosem.WebApi.Helpers
{
    public static class ExcelDbHelper
    {
        private static readonly string FilePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "excel_database.xlsx");
        private static readonly object FileLock = new object();

        private static void EnsureFolderExists()
        {
            var dir = Path.GetDirectoryName(FilePath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }
        }

        public static void AppendCheckList(
            string placa,
            string conductor,
            string servicio,
            decimal? kmInicial,
            decimal? kmFinal,
            decimal? hrInicial,
            decimal? hrFinal,
            decimal combustible,
            string estado,
            string observaciones)
        {
            lock (FileLock)
            {
                EnsureFolderExists();
                using var workbook = File.Exists(FilePath) ? new XLWorkbook(FilePath) : new XLWorkbook();
                var sheet = workbook.Worksheets.FirstOrDefault(w => w.Name == "CheckLists") ?? workbook.Worksheets.Add("CheckLists");

                // If new sheet, add headers
                if (sheet.LastRowUsed() == null)
                {
                    sheet.Cell(1, 1).Value = "Fecha";
                    sheet.Cell(1, 2).Value = "Placa";
                    sheet.Cell(1, 3).Value = "Conductor/Operador";
                    sheet.Cell(1, 4).Value = "Servicio";
                    sheet.Cell(1, 5).Value = "Km Inicial";
                    sheet.Cell(1, 6).Value = "Km Final";
                    sheet.Cell(1, 7).Value = "Hr Inicial";
                    sheet.Cell(1, 8).Value = "Hr Final";
                    sheet.Cell(1, 9).Value = "Combustible %";
                    sheet.Cell(1, 10).Value = "Estado Checklist";
                    sheet.Cell(1, 11).Value = "Observaciones";
                    sheet.Row(1).Style.Font.Bold = true;
                }

                int nextRow = sheet.LastRowUsed().RowNumber() + 1;
                sheet.Cell(nextRow, 1).Value = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                sheet.Cell(nextRow, 2).Value = placa;
                sheet.Cell(nextRow, 3).Value = conductor;
                sheet.Cell(nextRow, 4).Value = servicio;
                sheet.Cell(nextRow, 5).Value = kmInicial ?? 0;
                sheet.Cell(nextRow, 6).Value = kmFinal ?? 0;
                sheet.Cell(nextRow, 7).Value = hrInicial ?? 0;
                sheet.Cell(nextRow, 8).Value = hrFinal ?? 0;
                sheet.Cell(nextRow, 9).Value = combustible;
                sheet.Cell(nextRow, 10).Value = estado;
                sheet.Cell(nextRow, 11).Value = observaciones;

                workbook.SaveAs(FilePath);
            }
        }

        public static void AppendReporteTonelada(
            string placa,
            string conductor,
            string empresa,
            string material,
            string ruta,
            decimal pesoBruto,
            decimal tara,
            decimal pesoNeto,
            decimal humedad,
            decimal tms,
            string observaciones)
        {
            lock (FileLock)
            {
                EnsureFolderExists();
                using var workbook = File.Exists(FilePath) ? new XLWorkbook(FilePath) : new XLWorkbook();
                var sheet = workbook.Worksheets.FirstOrDefault(w => w.Name == "ReportesTonelada") ?? workbook.Worksheets.Add("ReportesTonelada");

                if (sheet.LastRowUsed() == null)
                {
                    sheet.Cell(1, 1).Value = "Fecha";
                    sheet.Cell(1, 2).Value = "Placa";
                    sheet.Cell(1, 3).Value = "Conductor";
                    sheet.Cell(1, 4).Value = "Empresa Contratista";
                    sheet.Cell(1, 5).Value = "Tipo Material";
                    sheet.Cell(1, 6).Value = "Ruta";
                    sheet.Cell(1, 7).Value = "Peso Bruto (Ton)";
                    sheet.Cell(1, 8).Value = "Tara (Ton)";
                    sheet.Cell(1, 9).Value = "Peso Neto (Ton)";
                    sheet.Cell(1, 10).Value = "% Humedad";
                    sheet.Cell(1, 11).Value = "TMS (Ton)";
                    sheet.Cell(1, 12).Value = "Observaciones";
                    sheet.Row(1).Style.Font.Bold = true;
                }

                int nextRow = sheet.LastRowUsed().RowNumber() + 1;
                sheet.Cell(nextRow, 1).Value = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                sheet.Cell(nextRow, 2).Value = placa;
                sheet.Cell(nextRow, 3).Value = conductor;
                sheet.Cell(nextRow, 4).Value = empresa;
                sheet.Cell(nextRow, 5).Value = material;
                sheet.Cell(nextRow, 6).Value = ruta;
                sheet.Cell(nextRow, 7).Value = pesoBruto;
                sheet.Cell(nextRow, 8).Value = tara;
                sheet.Cell(nextRow, 9).Value = pesoNeto;
                sheet.Cell(nextRow, 10).Value = humedad;
                sheet.Cell(nextRow, 11).Value = tms;
                sheet.Cell(nextRow, 12).Value = observaciones;

                workbook.SaveAs(FilePath);
            }
        }

        public static void AppendConductor(
            string nombre,
            string apellido,
            string dni,
            string licencia,
            string categoria,
            string telefono,
            string placa)
        {
            lock (FileLock)
            {
                EnsureFolderExists();
                using var workbook = File.Exists(FilePath) ? new XLWorkbook(FilePath) : new XLWorkbook();
                var sheet = workbook.Worksheets.FirstOrDefault(w => w.Name == "Conductores") ?? workbook.Worksheets.Add("Conductores");

                if (sheet.LastRowUsed() == null)
                {
                    sheet.Cell(1, 1).Value = "Nombre";
                    sheet.Cell(1, 2).Value = "Apellido";
                    sheet.Cell(1, 3).Value = "DNI";
                    sheet.Cell(1, 4).Value = "Licencia";
                    sheet.Cell(1, 5).Value = "Categoría";
                    sheet.Cell(1, 6).Value = "Teléfono";
                    sheet.Cell(1, 7).Value = "Placa Asignada";
                    sheet.Cell(1, 8).Value = "Fecha Registro";
                    sheet.Row(1).Style.Font.Bold = true;
                }

                int nextRow = sheet.LastRowUsed().RowNumber() + 1;
                sheet.Cell(nextRow, 1).Value = nombre;
                sheet.Cell(nextRow, 2).Value = apellido;
                sheet.Cell(nextRow, 3).Value = dni;
                sheet.Cell(nextRow, 4).Value = licencia;
                sheet.Cell(nextRow, 5).Value = categoria;
                sheet.Cell(nextRow, 6).Value = telefono;
                sheet.Cell(nextRow, 7).Value = placa;
                sheet.Cell(nextRow, 8).Value = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

                workbook.SaveAs(FilePath);
            }
        }

        public static void AppendCombustible(
            string placa,
            string conductor,
            decimal galones,
            decimal costo,
            decimal kilometraje,
            string fotoUrl,
            string observaciones)
        {
            lock (FileLock)
            {
                EnsureFolderExists();
                using var workbook = File.Exists(FilePath) ? new XLWorkbook(FilePath) : new XLWorkbook();
                var sheet = workbook.Worksheets.FirstOrDefault(w => w.Name == "Combustibles") ?? workbook.Worksheets.Add("Combustibles");

                if (sheet.LastRowUsed() == null)
                {
                    sheet.Cell(1, 1).Value = "Fecha";
                    sheet.Cell(1, 2).Value = "Placa";
                    sheet.Cell(1, 3).Value = "Conductor";
                    sheet.Cell(1, 4).Value = "Galones";
                    sheet.Cell(1, 5).Value = "Costo Total";
                    sheet.Cell(1, 6).Value = "Kilometraje";
                    sheet.Cell(1, 7).Value = "Foto Evidencia";
                    sheet.Cell(1, 8).Value = "Observaciones";
                    sheet.Row(1).Style.Font.Bold = true;
                }

                int nextRow = sheet.LastRowUsed().RowNumber() + 1;
                sheet.Cell(nextRow, 1).Value = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                sheet.Cell(nextRow, 2).Value = placa;
                sheet.Cell(nextRow, 3).Value = conductor;
                sheet.Cell(nextRow, 4).Value = galones;
                sheet.Cell(nextRow, 5).Value = costo;
                sheet.Cell(nextRow, 6).Value = kilometraje;
                sheet.Cell(nextRow, 7).Value = fotoUrl;
                sheet.Cell(nextRow, 8).Value = observaciones;

                workbook.SaveAs(FilePath);
            }
        }

        public static void AppendEquipo(
            string placa,
            string codigo,
            string tipo,
            string marca,
            string modelo,
            string serie,
            string motor,
            string chasis,
            string color,
            string estado,
            int? anio,
            decimal valor)
        {
            lock (FileLock)
            {
                EnsureFolderExists();
                using var workbook = File.Exists(FilePath) ? new XLWorkbook(FilePath) : new XLWorkbook();
                var sheet = workbook.Worksheets.FirstOrDefault(w => w.Name == "Equipos") ?? workbook.Worksheets.Add("Equipos");

                if (sheet.LastRowUsed() == null)
                {
                    sheet.Cell(1, 1).Value = "Placa";
                    sheet.Cell(1, 2).Value = "Código Interno";
                    sheet.Cell(1, 3).Value = "Tipo";
                    sheet.Cell(1, 4).Value = "Marca";
                    sheet.Cell(1, 5).Value = "Modelo";
                    sheet.Cell(1, 6).Value = "Serie";
                    sheet.Cell(1, 7).Value = "Motor";
                    sheet.Cell(1, 8).Value = "Chasis";
                    sheet.Cell(1, 9).Value = "Color";
                    sheet.Cell(1, 10).Value = "Estado";
                    sheet.Cell(1, 11).Value = "Año Fab.";
                    sheet.Cell(1, 12).Value = "Valor ($)";
                    sheet.Cell(1, 13).Value = "Fecha Registro";
                    sheet.Row(1).Style.Font.Bold = true;
                }

                int nextRow = sheet.LastRowUsed().RowNumber() + 1;
                sheet.Cell(nextRow, 1).Value = placa;
                sheet.Cell(nextRow, 2).Value = codigo;
                sheet.Cell(nextRow, 3).Value = tipo;
                sheet.Cell(nextRow, 4).Value = marca;
                sheet.Cell(nextRow, 5).Value = modelo;
                sheet.Cell(nextRow, 6).Value = serie;
                sheet.Cell(nextRow, 7).Value = motor;
                sheet.Cell(nextRow, 8).Value = chasis;
                sheet.Cell(nextRow, 9).Value = color;
                sheet.Cell(nextRow, 10).Value = estado;
                sheet.Cell(nextRow, 11).Value = anio ?? 0;
                sheet.Cell(nextRow, 12).Value = valor;
                sheet.Cell(nextRow, 13).Value = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

                workbook.SaveAs(FilePath);
            }
        }

        public static void GenerateExcelDatabase(Sigecosem.WebApi.Data.ApplicationDbContext context)
        {
            lock (FileLock)
            {
                EnsureFolderExists();
                using var workbook = new XLWorkbook();

                // 1. EQUIPOS
                var eqSheet = workbook.Worksheets.Add("Equipos");
                eqSheet.Cell(1, 1).Value = "Placa";
                eqSheet.Cell(1, 2).Value = "Código Interno";
                eqSheet.Cell(1, 3).Value = "Tipo";
                eqSheet.Cell(1, 4).Value = "Marca";
                eqSheet.Cell(1, 5).Value = "Modelo";
                eqSheet.Cell(1, 6).Value = "Serie";
                eqSheet.Cell(1, 7).Value = "Motor";
                eqSheet.Cell(1, 8).Value = "Chasis";
                eqSheet.Cell(1, 9).Value = "Color";
                eqSheet.Cell(1, 10).Value = "Estado";
                eqSheet.Cell(1, 11).Value = "Año Fab.";
                eqSheet.Cell(1, 12).Value = "Valor ($)";
                eqSheet.Cell(1, 13).Value = "Proyecto";
                eqSheet.Cell(1, 14).Value = "Área";
                eqSheet.Cell(1, 15).Value = "Supervisor";
                eqSheet.Cell(1, 16).Value = "Operador";
                eqSheet.Row(1).Style.Font.Bold = true;

                var equipos = context.Equipos
                    .Include(e => e.Proyecto)
                    .Include(e => e.Area)
                    .Include(e => e.Supervisor)
                    .Include(e => e.Operador)
                    .ToList();
                int row = 2;
                foreach (var eq in equipos)
                {
                    eqSheet.Cell(row, 1).Value = eq.Placa;
                    eqSheet.Cell(row, 2).Value = eq.CodigoInterno;
                    eqSheet.Cell(row, 3).Value = eq.Tipo;
                    eqSheet.Cell(row, 4).Value = eq.Marca;
                    eqSheet.Cell(row, 5).Value = eq.Modelo;
                    eqSheet.Cell(row, 6).Value = eq.Serie;
                    eqSheet.Cell(row, 7).Value = eq.Motor;
                    eqSheet.Cell(row, 8).Value = eq.Chasis;
                    eqSheet.Cell(row, 9).Value = eq.Color;
                    eqSheet.Cell(row, 10).Value = eq.Estado;
                    eqSheet.Cell(row, 11).Value = eq.AnioFabricacion ?? 0;
                    eqSheet.Cell(row, 12).Value = eq.Valor;
                    eqSheet.Cell(row, 13).Value = eq.Proyecto?.Nombre ?? "";
                    eqSheet.Cell(row, 14).Value = eq.Area?.Nombre ?? "";
                    eqSheet.Cell(row, 15).Value = eq.Supervisor != null ? $"{eq.Supervisor.Nombre} {eq.Supervisor.Apellido}" : "";
                    eqSheet.Cell(row, 16).Value = eq.Operador != null ? $"{eq.Operador.Nombre} {eq.Operador.Apellido}" : "";
                    row++;
                }

                // 2. CONDUCTORES
                var condSheet = workbook.Worksheets.Add("Conductores");
                condSheet.Cell(1, 1).Value = "Nombre";
                condSheet.Cell(1, 2).Value = "Apellido";
                condSheet.Cell(1, 3).Value = "DNI";
                condSheet.Cell(1, 4).Value = "Licencia";
                condSheet.Cell(1, 5).Value = "Categoría";
                condSheet.Cell(1, 6).Value = "Teléfono";
                condSheet.Cell(1, 7).Value = "Equipos Autorizados";
                condSheet.Cell(1, 8).Value = "Activo";
                condSheet.Cell(1, 9).Value = "Fecha Registro";
                condSheet.Row(1).Style.Font.Bold = true;

                var conductores = context.Conductores.ToList();
                row = 2;
                foreach (var c in conductores)
                {
                    condSheet.Cell(row, 1).Value = c.Nombre;
                    condSheet.Cell(row, 2).Value = c.Apellido;
                    condSheet.Cell(row, 3).Value = c.Dni;
                    condSheet.Cell(row, 4).Value = c.Licencia;
                    condSheet.Cell(row, 5).Value = c.CategoriaLicencia;
                    condSheet.Cell(row, 6).Value = c.Telefono;
                    condSheet.Cell(row, 7).Value = c.TipoEquipoAutorizado;
                    condSheet.Cell(row, 8).Value = c.Activo ? "Sí" : "No";
                    condSheet.Cell(row, 9).Value = c.FechaRegistro.ToString("yyyy-MM-dd HH:mm:ss");
                    row++;
                }

                // 3. CHECKLISTS
                var chkSheet = workbook.Worksheets.Add("CheckLists");
                chkSheet.Cell(1, 1).Value = "Fecha";
                chkSheet.Cell(1, 2).Value = "Placa";
                chkSheet.Cell(1, 3).Value = "Operador";
                chkSheet.Cell(1, 4).Value = "Supervisor";
                chkSheet.Cell(1, 5).Value = "Conductor";
                chkSheet.Cell(1, 6).Value = "Servicio";
                chkSheet.Cell(1, 7).Value = "Km Inicial";
                chkSheet.Cell(1, 8).Value = "Km Final";
                chkSheet.Cell(1, 9).Value = "Hr Inicial";
                chkSheet.Cell(1, 10).Value = "Hr Final";
                chkSheet.Cell(1, 11).Value = "Combustible %";
                chkSheet.Cell(1, 12).Value = "Estado Checklist";
                chkSheet.Cell(1, 13).Value = "Observaciones";
                chkSheet.Row(1).Style.Font.Bold = true;

                var checklists = context.CheckLists
                    .Include(c => c.Operador)
                    .Include(c => c.Supervisor)
                    .Include(c => c.Conductor)
                    .OrderByDescending(c => c.FechaHora)
                    .ToList();
                row = 2;
                foreach (var chk in checklists)
                {
                    chkSheet.Cell(row, 1).Value = chk.FechaHora.ToString("yyyy-MM-dd HH:mm:ss");
                    chkSheet.Cell(row, 2).Value = chk.EquipoPlaca;
                    chkSheet.Cell(row, 3).Value = chk.Operador != null ? $"{chk.Operador.Nombre} {chk.Operador.Apellido}" : "";
                    chkSheet.Cell(row, 4).Value = chk.Supervisor != null ? $"{chk.Supervisor.Nombre} {chk.Supervisor.Apellido}" : "";
                    chkSheet.Cell(row, 5).Value = chk.Conductor != null ? $"{chk.Conductor.Nombre} {chk.Conductor.Apellido}" : "";
                    chkSheet.Cell(row, 6).Value = chk.Servicio;
                    chkSheet.Cell(row, 7).Value = chk.KilometrajeInicial ?? 0;
                    chkSheet.Cell(row, 8).Value = chk.KilometrajeFinal ?? 0;
                    chkSheet.Cell(row, 9).Value = chk.HorometroInicial ?? 0;
                    chkSheet.Cell(row, 10).Value = chk.HorometroFinal ?? 0;
                    chkSheet.Cell(row, 11).Value = chk.CombustibleNivel;
                    chkSheet.Cell(row, 12).Value = chk.Estado;
                    chkSheet.Cell(row, 13).Value = chk.Observaciones;
                    row++;
                }

                // 4. TAREOS
                var tarSheet = workbook.Worksheets.Add("Tareos");
                tarSheet.Cell(1, 1).Value = "Fecha";
                tarSheet.Cell(1, 2).Value = "Placa";
                tarSheet.Cell(1, 3).Value = "Operador";
                tarSheet.Cell(1, 4).Value = "Conductor";
                tarSheet.Cell(1, 5).Value = "Actividad";
                tarSheet.Cell(1, 6).Value = "Hora Inicio";
                tarSheet.Cell(1, 7).Value = "Hora Fin";
                tarSheet.Cell(1, 8).Value = "Horas Normales";
                tarSheet.Cell(1, 9).Value = "Horas Extras";
                tarSheet.Cell(1, 10).Value = "Proyecto";
                tarSheet.Cell(1, 11).Value = "Área";
                tarSheet.Cell(1, 12).Value = "Observaciones";
                tarSheet.Row(1).Style.Font.Bold = true;

                var tareos = context.Tareos
                    .Include(t => t.Operador)
                    .Include(t => t.Conductor)
                    .Include(t => t.Proyecto)
                    .Include(t => t.Area)
                    .OrderByDescending(t => t.Fecha)
                    .ToList();
                row = 2;
                foreach (var t in tareos)
                {
                    tarSheet.Cell(row, 1).Value = t.Fecha.ToString("yyyy-MM-dd");
                    tarSheet.Cell(row, 2).Value = t.EquipoPlaca;
                    tarSheet.Cell(row, 3).Value = t.Operador != null ? $"{t.Operador.Nombre} {t.Operador.Apellido}" : "";
                    tarSheet.Cell(row, 4).Value = t.Conductor != null ? $"{t.Conductor.Nombre} {t.Conductor.Apellido}" : "";
                    tarSheet.Cell(row, 5).Value = t.Actividad;
                    tarSheet.Cell(row, 6).Value = t.HoraInicio.ToString(@"hh\:mm");
                    tarSheet.Cell(row, 7).Value = t.HoraFin.ToString(@"hh\:mm");
                    tarSheet.Cell(row, 8).Value = t.HorasNormales;
                    tarSheet.Cell(row, 9).Value = t.HorasExtras;
                    tarSheet.Cell(row, 10).Value = t.Proyecto?.Nombre ?? "";
                    tarSheet.Cell(row, 11).Value = t.Area?.Nombre ?? "";
                    tarSheet.Cell(row, 12).Value = t.Observaciones;
                    row++;
                }

                // 5. COMBUSTIBLES
                var combSheet = workbook.Worksheets.Add("Combustibles");
                combSheet.Cell(1, 1).Value = "Fecha";
                combSheet.Cell(1, 2).Value = "Placa";
                combSheet.Cell(1, 3).Value = "Proveedor";
                combSheet.Cell(1, 4).Value = "Grifo";
                combSheet.Cell(1, 5).Value = "Galones";
                combSheet.Cell(1, 6).Value = "Precio x Galón";
                combSheet.Cell(1, 7).Value = "Costo Total";
                combSheet.Cell(1, 8).Value = "Horómetro";
                combSheet.Cell(1, 9).Value = "Conductor";
                combSheet.Cell(1, 10).Value = "Operador";
                combSheet.Row(1).Style.Font.Bold = true;

                var combustibles = context.Combustibles
                    .Include(c => c.Conductor)
                    .Include(c => c.Operador)
                    .OrderByDescending(c => c.Fecha)
                    .ToList();
                row = 2;
                foreach (var c in combustibles)
                {
                    combSheet.Cell(row, 1).Value = c.Fecha.ToString("yyyy-MM-dd HH:mm:ss");
                    combSheet.Cell(row, 2).Value = c.EquipoPlaca;
                    combSheet.Cell(row, 3).Value = c.Proveedor;
                    combSheet.Cell(row, 4).Value = c.Grifo;
                    combSheet.Cell(row, 5).Value = c.Galones;
                    combSheet.Cell(row, 6).Value = c.PrecioGalon;
                    combSheet.Cell(row, 7).Value = c.CostoTotal;
                    combSheet.Cell(row, 8).Value = c.HorometroVal;
                    combSheet.Cell(row, 9).Value = c.Conductor != null ? $"{c.Conductor.Nombre} {c.Conductor.Apellido}" : "";
                    combSheet.Cell(row, 10).Value = c.Operador != null ? $"{c.Operador.Nombre} {c.Operador.Apellido}" : "";
                    row++;
                }

                // 6. MANTENIMIENTOS
                var maintSheet = workbook.Worksheets.Add("Mantenimientos");
                maintSheet.Cell(1, 1).Value = "Fecha";
                maintSheet.Cell(1, 2).Value = "Placa";
                maintSheet.Cell(1, 3).Value = "Tipo";
                maintSheet.Cell(1, 4).Value = "Descripción";
                maintSheet.Cell(1, 5).Value = "Costo Total";
                maintSheet.Cell(1, 6).Value = "Proveedor";
                maintSheet.Cell(1, 7).Value = "Responsable";
                maintSheet.Row(1).Style.Font.Bold = true;

                var mantenimientos = context.Mantenimientos
                    .OrderByDescending(m => m.Fecha)
                    .ToList();
                row = 2;
                foreach (var m in mantenimientos)
                {
                    maintSheet.Cell(row, 1).Value = m.Fecha.ToString("yyyy-MM-dd");
                    maintSheet.Cell(row, 2).Value = m.EquipoPlaca;
                    maintSheet.Cell(row, 3).Value = m.Tipo;
                    maintSheet.Cell(row, 4).Value = m.Descripcion;
                    maintSheet.Cell(row, 5).Value = m.CostoTotal;
                    maintSheet.Cell(row, 6).Value = m.Proveedor;
                    maintSheet.Cell(row, 7).Value = m.Responsable;
                    row++;
                }

                // 7. REPORTES TONELADA
                var tonSheet = workbook.Worksheets.Add("ReportesTonelada");
                tonSheet.Cell(1, 1).Value = "Fecha";
                tonSheet.Cell(1, 2).Value = "Placa";
                tonSheet.Cell(1, 3).Value = "Conductor";
                tonSheet.Cell(1, 4).Value = "Empresa Contratista";
                tonSheet.Cell(1, 5).Value = "Tipo Material";
                tonSheet.Cell(1, 6).Value = "Ruta";
                tonSheet.Cell(1, 7).Value = "Peso Bruto";
                tonSheet.Cell(1, 8).Value = "Tara";
                tonSheet.Cell(1, 9).Value = "Peso Neto";
                tonSheet.Cell(1, 10).Value = "% Humedad";
                tonSheet.Cell(1, 11).Value = "TMS";
                tonSheet.Cell(1, 12).Value = "Observaciones";
                tonSheet.Row(1).Style.Font.Bold = true;

                var reportes = context.ReportesTonelada.OrderByDescending(r => r.Fecha).ToList();
                row = 2;
                foreach (var r in reportes)
                {
                    tonSheet.Cell(row, 1).Value = r.Fecha.ToString("yyyy-MM-dd HH:mm:ss");
                    tonSheet.Cell(row, 2).Value = r.Placa;
                    tonSheet.Cell(row, 3).Value = r.Conductor;
                    tonSheet.Cell(row, 4).Value = r.EmpresaContratista;
                    tonSheet.Cell(row, 5).Value = r.TipoMaterial;
                    tonSheet.Cell(row, 6).Value = r.Ruta;
                    tonSheet.Cell(row, 7).Value = r.PesoBruto;
                    tonSheet.Cell(row, 8).Value = r.Tara;
                    tonSheet.Cell(row, 9).Value = r.PesoNeto;
                    tonSheet.Cell(row, 10).Value = r.Humedad;
                    tonSheet.Cell(row, 11).Value = r.Tms;
                    tonSheet.Cell(row, 12).Value = r.Observaciones;
                    row++;
                }

                // 8. USUARIOS
                var userSheet = workbook.Worksheets.Add("Usuarios");
                userSheet.Cell(1, 1).Value = "Username";
                userSheet.Cell(1, 2).Value = "Nombre";
                userSheet.Cell(1, 3).Value = "Apellido";
                userSheet.Cell(1, 4).Value = "Email";
                userSheet.Cell(1, 5).Value = "Cargo / Puesto";
                userSheet.Cell(1, 6).Value = "Rol";
                userSheet.Cell(1, 7).Value = "Área";
                userSheet.Cell(1, 8).Value = "Estado (Activo)";
                userSheet.Cell(1, 9).Value = "Permisos de Acceso";
                userSheet.Row(1).Style.Font.Bold = true;

                var usuarios = context.Usuarios
                    .Include(u => u.Rol)
                    .Include(u => u.Area)
                    .OrderBy(u => u.Username)
                    .ToList();
                row = 2;
                foreach (var u in usuarios)
                {
                    userSheet.Cell(row, 1).Value = u.Username;
                    userSheet.Cell(row, 2).Value = u.Nombre;
                    userSheet.Cell(row, 3).Value = u.Apellido;
                    userSheet.Cell(row, 4).Value = u.Email;
                    userSheet.Cell(row, 5).Value = u.Cargo;
                    userSheet.Cell(row, 6).Value = u.Rol?.Nombre ?? "";
                    userSheet.Cell(row, 7).Value = u.Area?.Nombre ?? "";
                    userSheet.Cell(row, 8).Value = u.Activo ? "Sí" : "No";
                    userSheet.Cell(row, 9).Value = u.Permisos;
                    row++;
                }

                workbook.SaveAs(FilePath);
            }
        }
    }
}
