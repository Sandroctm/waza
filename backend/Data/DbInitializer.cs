using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Sigecosem.WebApi.Models;

namespace Sigecosem.WebApi.Data
{
    public static class DbInitializer
    {
        private static void SeedSupplemental(ApplicationDbContext context)
        {
            if (!context.Roles.Any() || !context.Areas.Any())
            {
                return;
            }

            var alpayanaRol = context.Roles.FirstOrDefault(r => r.Nombre == "Alpayana");
            if (alpayanaRol == null)
            {
                alpayanaRol = new Rol { Nombre = "Alpayana", Permisos = "dashboard:view,equipos:view,checklist:write,tareos:write,combustible:write,mantenimiento:view" };
                context.Roles.Add(alpayanaRol);
                context.SaveChanges();
            }

            var alpayanaUser = context.Usuarios.FirstOrDefault(u => u.Username.ToLower() == "alpayana");
            if (alpayanaUser == null)
            {
                using var sha256 = SHA256.Create();
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes("alpayana123"));
                var passwordHash = Convert.ToHexString(hashedBytes).ToLower();

                var systemsArea = context.Areas.FirstOrDefault(a => a.Nombre == "Sistemas e Informática") ?? context.Areas.First();
                context.Usuarios.Add(new Usuario
                {
                    Username = "alpayana",
                    PasswordHash = passwordHash,
                    Nombre = "Alpayana",
                    Apellido = "Convenio",
                    Email = "alpayana@ecosem.com",
                    RolId = alpayanaRol.Id,
                    AreaId = systemsArea.Id,
                    Activo = true
                });
                context.SaveChanges();
            }

            var firstProj = context.Proyectos.FirstOrDefault()?.Id ?? 1;
            var firstArea = context.Areas.FirstOrDefault()?.Id ?? 1;
            
            // Find appropriate users or fallback to first
            var firstSup = context.Usuarios.FirstOrDefault(u => u.Rol.Nombre == "SSOMA")?.Id ?? 1;
            var firstOper = context.Usuarios.FirstOrDefault(u => u.Rol.Nombre == "Lodos" || u.Rol.Nombre == "Conductor")?.Id ?? 1;

            if (!context.Equipos.Any(e => e.Tipo == "Tracto Oruga"))
            {
                context.Equipos.Add(new Equipo
                {
                    Placa = "TRA-555", CodigoInterno = "TRA-01", Tipo = "Tracto Oruga", Marca = "Caterpillar", Modelo = "D8T",
                    Serie = "CATD8T00001", Motor = "C15", Chasis = "CAT-CHASIS-D8T", Color = "Amarillo",
                    ProyectoId = firstProj, AreaId = firstArea, SupervisorId = firstSup, OperadorId = firstOper,
                    Estado = "Disponible", FechaCompra = DateTime.UtcNow.AddYears(-1), Valor = 350000m, Seguro = "La Positiva",
                    SOATVencimiento = DateTime.UtcNow.AddMonths(12), RevisionTecnicaVencimiento = DateTime.UtcNow.AddMonths(12),
                    FotoUrl = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400", GPSId = "GPS-TRA-01"
                });
            }

            if (!context.Equipos.Any(e => e.Tipo == "Rodillo Compactador"))
            {
                context.Equipos.Add(new Equipo
                {
                    Placa = "ROD-888", CodigoInterno = "ROD-01", Tipo = "Rodillo Compactador", Marca = "Dynapac", Modelo = "CA250",
                    Serie = "DYNACA250001", Motor = "Cummins", Chasis = "DYNA-CHASIS-CA250", Color = "Amarillo",
                    ProyectoId = firstProj, AreaId = firstArea, SupervisorId = firstSup, OperadorId = firstOper,
                    Estado = "Disponible", FechaCompra = DateTime.UtcNow.AddYears(-2), Valor = 120000m, Seguro = "Rimac",
                    SOATVencimiento = DateTime.UtcNow.AddMonths(12), RevisionTecnicaVencimiento = DateTime.UtcNow.AddMonths(12),
                    FotoUrl = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400", GPSId = "GPS-ROD-01"
                });
            }

            if (!context.Equipos.Any(e => e.Tipo == "Camioneta"))
            {
                context.Equipos.Add(new Equipo
                {
                    Placa = "CAM-111", CodigoInterno = "CAM-01", Tipo = "Camioneta", Marca = "Toyota", Modelo = "Hilux 4x4",
                    Serie = "TOYOHILUX00001", Motor = "1GD-FTV", Chasis = "TOYO-CHASIS-HILUX", Color = "Blanco",
                    ProyectoId = firstProj, AreaId = firstArea, SupervisorId = firstSup, OperadorId = firstOper,
                    Estado = "Disponible", FechaCompra = DateTime.UtcNow.AddYears(-1), Valor = 45000m, Seguro = "Pacífico",
                    SOATVencimiento = DateTime.UtcNow.AddMonths(12), RevisionTecnicaVencimiento = DateTime.UtcNow.AddMonths(12),
                    FotoUrl = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400", GPSId = "GPS-CAM-01"
                });
            }
            context.SaveChanges();
        }

        public static void Initialize(ApplicationDbContext context)
        {
            context.Database.EnsureCreated();

            SeedSupplemental(context);

            // Look for any users.
            if (context.Usuarios.Any())
            {
                return;   // DB has been seeded
            }

            // --- 1. Seed Roles ---
            var roles = new List<Rol>
            {
                new Rol { Nombre = "Gerente", Permisos = "dashboard:view,equipos:view,reportes:view,gps:view" },
                new Rol { Nombre = "Planeamiento", Permisos = "dashboard:view,equipos:view,equipos:edit,programacion:write,tareos:write" },
                new Rol { Nombre = "Lodos", Permisos = "dashboard:view,equipos:view,tareos:write,combustible:write,checklist:write" },
                new Rol { Nombre = "Relleno", Permisos = "dashboard:view,equipos:view,tareos:write,combustible:write,checklist:write" },
                new Rol { Nombre = "Vigilancia", Permisos = "vigilancia:write,equipos:view" },
                new Rol { Nombre = "SSOMA", Permisos = "dashboard:view,equipos:view,checklist:write,equipos:block,checklist:approve" },
                new Rol { Nombre = "Administrador", Permisos = "admin:all" }
            };
            context.Roles.AddRange(roles);
            context.SaveChanges();

            // --- 2. Seed Areas ---
            var areas = new List<Area>
            {
                new Area { Nombre = "Gerencia" },
                new Area { Nombre = "Planeamiento y Control" },
                new Area { Nombre = "Área de Lodos" },
                new Area { Nombre = "Relleno Sanitario" },
                new Area { Nombre = "Vigilancia y Control" },
                new Area { Nombre = "SSOMA" },
                new Area { Nombre = "Sistemas e Informática" }
            };
            context.Areas.AddRange(areas);
            context.SaveChanges();

            // --- 3. Seed Proyectos ---
            var proyectos = new List<Proyecto>
            {
                new Proyecto { Nombre = "Minera Las Bambas", Ubicacion = "Apurímac, Cotabambas", Activo = true },
                new Proyecto { Nombre = "Proyecto Toromocho", Ubicacion = "Junín, Morococha", Activo = true },
                new Proyecto { Nombre = "Planta Lodos Ecosem", Ubicacion = "Junín, La Oroya", Activo = true },
                new Proyecto { Nombre = "Relleno Sanitario Huancayo", Ubicacion = "Huancayo, Pedregal", Activo = true }
            };
            context.Proyectos.AddRange(proyectos);
            context.SaveChanges();

            // --- 4. Seed Users ---
            string HashPassword(string password)
            {
                using var sha256 = SHA256.Create();
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToHexString(hashedBytes).ToLower();
            }

            var adminRol = roles.First(r => r.Nombre == "Administrador");
            var gerenteRol = roles.First(r => r.Nombre == "Gerente");
            var planeamientoRol = roles.First(r => r.Nombre == "Planeamiento");
            var lodosRol = roles.First(r => r.Nombre == "Lodos");
            var rellenoRol = roles.First(r => r.Nombre == "Relleno");
            var vigilanteRol = roles.First(r => r.Nombre == "Vigilancia");
            var ssomaRol = roles.First(r => r.Nombre == "SSOMA");

            var usuarios = new List<Usuario>
            {
                new Usuario { Username = "admin", PasswordHash = HashPassword("admin123"), Nombre = "Admin", Apellido = "Ecosem", RolId = adminRol.Id, AreaId = areas.First(a => a.Nombre == "Sistemas e Informática").Id },
                new Usuario { Username = "gerente", PasswordHash = HashPassword("gerente123"), Nombre = "Carlos", Apellido = "Mendoza", RolId = gerenteRol.Id, AreaId = areas.First(a => a.Nombre == "Gerencia").Id },
                new Usuario { Username = "planeamiento", PasswordHash = HashPassword("plan123"), Nombre = "Lucia", Apellido = "Rojas", RolId = planeamientoRol.Id, AreaId = areas.First(a => a.Nombre == "Planeamiento y Control").Id },
                new Usuario { Username = "lodos", PasswordHash = HashPassword("lodos123"), Nombre = "Manuel", Apellido = "Pérez", RolId = lodosRol.Id, AreaId = areas.First(a => a.Nombre == "Área de Lodos").Id },
                new Usuario { Username = "relleno", PasswordHash = HashPassword("relleno123"), Nombre = "Juan", Apellido = "Gómez", RolId = rellenoRol.Id, AreaId = areas.First(a => a.Nombre == "Relleno Sanitario").Id },
                new Usuario { Username = "vigilante", PasswordHash = HashPassword("vigilante123"), Nombre = "Pedro", Apellido = "Castillo", RolId = vigilanteRol.Id, AreaId = areas.First(a => a.Nombre == "Vigilancia y Control").Id },
                new Usuario { Username = "ssoma", PasswordHash = HashPassword("ssoma123"), Nombre = "Sofía", Apellido = "Estrada", RolId = ssomaRol.Id, AreaId = areas.First(a => a.Nombre == "SSOMA").Id }
            };
            context.Usuarios.AddRange(usuarios);
            context.SaveChanges();

            // --- 5. Seed Equipos ---
            var operadorLodos = usuarios.First(u => u.Username == "lodos");
            var operadorRelleno = usuarios.First(u => u.Username == "relleno");
            var supervisorSsoma = usuarios.First(u => u.Username == "ssoma");

            var proyectoLasBambas = proyectos.First(p => p.Nombre == "Minera Las Bambas");
            var proyectoToromocho = proyectos.First(p => p.Nombre == "Proyecto Toromocho");
            var proyectoLodos = proyectos.First(p => p.Nombre == "Planta Lodos Ecosem");
            var proyectoRelleno = proyectos.First(p => p.Nombre == "Relleno Sanitario Huancayo");

            var areaLodos = areas.First(a => a.Nombre == "Área de Lodos");
            var areaRelleno = areas.First(a => a.Nombre == "Relleno Sanitario");

            var equipos = new List<Equipo>
            {
                new Equipo
                {
                    Placa = "EGS-123", CodigoInterno = "VOL-01", Tipo = "Volquete", Marca = "Volvo", Modelo = "FMX 460",
                    Serie = "YV3RT40A9H876543", Motor = "D13K460", Chasis = "9BV231908H", Color = "Blanco",
                    ProyectoId = proyectoLasBambas.Id, AreaId = areaLodos.Id, SupervisorId = supervisorSsoma.Id, OperadorId = operadorLodos.Id,
                    Estado = "Disponible", FechaCompra = DateTime.UtcNow.AddYears(-3), Valor = 155000m, Seguro = "Rimac Todo Riesgo",
                    SOATVencimiento = DateTime.UtcNow.AddMonths(8), RevisionTecnicaVencimiento = DateTime.UtcNow.AddMonths(4),
                    FotoUrl = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400", GPSId = "GPS-VOL-01"
                },
                new Equipo
                {
                    Placa = "EGS-456", CodigoInterno = "VOL-02", Tipo = "Volquete", Marca = "Scania", Modelo = "G440 XT",
                    Serie = "YS2G8X4000432190", Motor = "DC13", Chasis = "9BV231908K", Color = "Amarillo",
                    ProyectoId = proyectoToromocho.Id, AreaId = areaLodos.Id, SupervisorId = supervisorSsoma.Id, OperadorId = operadorLodos.Id,
                    Estado = "Operativo", FechaCompra = DateTime.UtcNow.AddYears(-2), Valor = 175000m, Seguro = "Pacífico Corporativo",
                    SOATVencimiento = DateTime.UtcNow.AddMonths(2), RevisionTecnicaVencimiento = DateTime.UtcNow.AddMonths(-1), // Vencido!
                    FotoUrl = "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400", GPSId = "GPS-VOL-02"
                },
                new Equipo
                {
                    Placa = "EXC-789", CodigoInterno = "EXC-01", Tipo = "Excavadora", Marca = "Caterpillar", Modelo = "336 GC",
                    Serie = "CAT0336GCE876543", Motor = "C7.1 ACERT", Chasis = "CAT-CHASIS-336", Color = "Amarillo",
                    ProyectoId = proyectoLasBambas.Id, AreaId = areaLodos.Id, SupervisorId = supervisorSsoma.Id, OperadorId = operadorLodos.Id,
                    Estado = "Bloqueado por SSOMA", FechaCompra = DateTime.UtcNow.AddYears(-4), Valor = 280000m, Seguro = "La Positiva",
                    SOATVencimiento = DateTime.UtcNow.AddMonths(5), RevisionTecnicaVencimiento = DateTime.UtcNow.AddMonths(5),
                    FotoUrl = "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400", GPSId = "GPS-EXC-01"
                },
                new Equipo
                {
                    Placa = "RET-101", CodigoInterno = "RET-01", Tipo = "Retroexcavadora", Marca = "John Deere", Modelo = "310L",
                    Serie = "1T0310LJC876543", Motor = "4045T", Chasis = "JD-CHASIS-310", Color = "Verde",
                    ProyectoId = proyectoRelleno.Id, AreaId = areaRelleno.Id, SupervisorId = supervisorSsoma.Id, OperadorId = operadorRelleno.Id,
                    Estado = "Disponible", FechaCompra = DateTime.UtcNow.AddYears(-1), Valor = 95000m, Seguro = "Rimac Todo Riesgo",
                    SOATVencimiento = DateTime.UtcNow.AddMonths(11), RevisionTecnicaVencimiento = DateTime.UtcNow.AddMonths(11),
                    FotoUrl = "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400", GPSId = "GPS-RET-01"
                },
                new Equipo
                {
                    Placa = "CAR-202", CodigoInterno = "CAR-01", Tipo = "Cargador Frontal", Marca = "Caterpillar", Modelo = "950 GC",
                    Serie = "CAT0950GCE876543", Motor = "C7.1", Chasis = "CAT-CHASIS-950", Color = "Amarillo",
                    ProyectoId = proyectoRelleno.Id, AreaId = areaRelleno.Id, SupervisorId = supervisorSsoma.Id, OperadorId = operadorRelleno.Id,
                    Estado = "En mantenimiento preventivo", FechaCompra = DateTime.UtcNow.AddYears(-5), Valor = 220000m, Seguro = "Pacífico",
                    SOATVencimiento = DateTime.UtcNow.AddMonths(-2), RevisionTecnicaVencimiento = DateTime.UtcNow.AddMonths(-2), // Vencidos
                    FotoUrl = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400", GPSId = "GPS-CAR-01"
                }
            };
            context.Equipos.AddRange(equipos);
            context.SaveChanges();

            // --- 6. Seed Checklist ---
            string checklistItems = @"
            {
                ""motor"": {""estado"": ""Bueno"", ""observacion"": ""Nivel de aceite correcto""},
                ""frenos"": {""estado"": ""Bueno"", ""observacion"": ""Presión estable""},
                ""direccion"": {""estado"": ""Bueno"", ""observacion"": ""Fluida""},
                ""luces"": {""estado"": ""Bueno"", ""observacion"": ""Luz alta izquierda con baja intensidad""},
                ""neumaticos"": {""estado"": ""Bueno"", ""observacion"": ""Cocada con desgaste normal""},
                ""alarmaRetroceso"": {""estado"": ""Bueno"", ""observacion"": ""Operativo""},
                ""extintor"": {""estado"": ""Bueno"", ""observacion"": ""Carga vigente""},
                ""fluidos"": {""estado"": ""Malo"", ""observacion"": ""Fuga menor de hidrolina en manguera secundaria""}
            }";

            string checklistFallaCritica = @"
            {
                ""motor"": {""estado"": ""Bueno"", ""observacion"": ""OK""},
                ""frenos"": {""estado"": ""Malo"", ""observacion"": ""Fuga de aire severa, pedal esponjoso""},
                ""direccion"": {""estado"": ""Bueno"", ""observacion"": ""OK""},
                ""luces"": {""estado"": ""Bueno"", ""observacion"": ""OK""},
                ""neumaticos"": {""estado"": ""Bueno"", ""observacion"": ""OK""},
                ""alarmaRetroceso"": {""estado"": ""Bueno"", ""observacion"": ""OK""},
                ""extintor"": {""estado"": ""Bueno"", ""observacion"": ""OK""},
                ""fluidos"": {""estado"": ""Bueno"", ""observacion"": ""OK""}
            }";

            var checklists = new List<CheckList>
            {
                new CheckList
                {
                    EquipoPlaca = "EGS-123", FechaHora = DateTime.UtcNow.AddDays(-1), Semana = 26, Mes = 6, Anio = 2026,
                    OperadorId = operadorLodos.Id, SupervisorId = supervisorSsoma.Id, ProyectoId = proyectoLasBambas.Id, AreaId = areaLodos.Id,
                    CombustibleNivel = 75m, Observaciones = "Inspección pre-operacional estándar. Fuga menor de hidrolina reportada.",
                    TieneFallasCriticas = false, Estado = "Aprobado", FirmaOperador = "FIRMA_OPERADOR_B64_MOCK", FirmaSupervisor = "FIRMA_SUPERVISOR_B64_MOCK",
                    ItemsJson = checklistItems
                },
                new CheckList
                {
                    EquipoPlaca = "EXC-789", FechaHora = DateTime.UtcNow.AddDays(-2), Semana = 26, Mes = 6, Anio = 2026,
                    OperadorId = operadorLodos.Id, SupervisorId = supervisorSsoma.Id, ProyectoId = proyectoLasBambas.Id, AreaId = areaLodos.Id,
                    CombustibleNivel = 45m, Observaciones = "Falla crítica en sistema de frenos neumático detectada por operador.",
                    TieneFallasCriticas = true, Estado = "Rechazado", FirmaOperador = "FIRMA_OPERADOR_B64_MOCK", FirmaSupervisor = "",
                    ItemsJson = checklistFallaCritica
                }
            };
            context.CheckLists.AddRange(checklists);
            context.SaveChanges();

            // --- 7. Seed Tareo & Horometros ---
            var tareos = new List<Tareo>
            {
                new Tareo
                {
                    EquipoPlaca = "EGS-123", OperadorId = operadorLodos.Id, Actividad = "Acarreo de material arcilloso de mina a botadero",
                    Fecha = DateTime.UtcNow.AddDays(-1).Date, HoraInicio = new TimeSpan(7, 0, 0), HoraFin = new TimeSpan(18, 0, 0),
                    HorasNormales = 8m, HorasExtras = 3m, ProyectoId = proyectoLasBambas.Id, AreaId = areaLodos.Id, Observaciones = "Operación continua sin incidencias."
                },
                new Tareo
                {
                    EquipoPlaca = "EGS-456", OperadorId = operadorLodos.Id, Actividad = "Movimiento de tierras en desborde de taludes",
                    Fecha = DateTime.UtcNow.AddDays(-1).Date, HoraInicio = new TimeSpan(8, 0, 0), HoraFin = new TimeSpan(17, 0, 0),
                    HorasNormales = 8m, HorasExtras = 1m, ProyectoId = proyectoToromocho.Id, AreaId = areaLodos.Id, Observaciones = "Bajo lluvia fuerte en la tarde."
                }
            };
            context.Tareos.AddRange(tareos);

            var horometros = new List<Horometro>
            {
                new Horometro { EquipoPlaca = "EGS-123", Fecha = DateTime.UtcNow.AddDays(-3), Inicial = 1250.5m, Final = 1258.5m, HorasTrabajadas = 8m, ProximoMantenimiento = 1500m },
                new Horometro { EquipoPlaca = "EGS-123", Fecha = DateTime.UtcNow.AddDays(-2), Inicial = 1258.5m, Final = 1269.0m, HorasTrabajadas = 10.5m, ProximoMantenimiento = 1500m },
                new Horometro { EquipoPlaca = "EGS-123", Fecha = DateTime.UtcNow.AddDays(-1), Inicial = 1269.0m, Final = 1280.0m, HorasTrabajadas = 11m, ProximoMantenimiento = 1500m },
                new Horometro { EquipoPlaca = "EGS-456", Fecha = DateTime.UtcNow.AddDays(-1), Inicial = 3420.0m, Final = 3429.0m, HorasTrabajadas = 9m, ProximoMantenimiento = 3650m }
            };
            context.Horometros.AddRange(horometros);
            context.SaveChanges();

            // --- 8. Seed Combustible ---
            var combustibles = new List<Combustible>
            {
                new Combustible
                {
                    EquipoPlaca = "EGS-123", Proveedor = "Pecsa", Grifo = "Grifo Las Bambas Central", Galones = 45.5m,
                    PrecioGalon = 16.5m, CostoTotal = 750.75m, HorometroVal = 1269.0m, OperadorId = operadorLodos.Id,
                    ProyectoId = proyectoLasBambas.Id, AreaId = areaLodos.Id, Fecha = DateTime.UtcNow.AddDays(-2)
                },
                new Combustible
                {
                    EquipoPlaca = "EGS-456", Proveedor = "Primax", Grifo = "Grifo Toromocho Auxiliar", Galones = 52.0m,
                    PrecioGalon = 17.2m, CostoTotal = 894.4m, HorometroVal = 3420.0m, OperadorId = operadorLodos.Id,
                    ProyectoId = proyectoToromocho.Id, AreaId = areaLodos.Id, Fecha = DateTime.UtcNow.AddDays(-1)
                }
            };
            context.Combustibles.AddRange(combustibles);
            context.SaveChanges();

            // --- 9. Seed Mantenimiento ---
            string repuestosJson = @"[
                {""nombre"": ""Filtro de Aceite Volvo"", ""cantidad"": 1, ""precio"": 120.00},
                {""nombre"": ""Filtro de Aire Primario"", ""cantidad"": 1, ""precio"": 250.00},
                {""nombre"": ""Aceite Lubricante Mobil Delvac 15W40 (Gal)"", ""cantidad"": 10, ""precio"": 65.00}
            ]";

            var mantenimientos = new List<Mantenimiento>
            {
                new Mantenimiento
                {
                    EquipoPlaca = "EGS-123", Tipo = "Preventivo", Descripcion = "Mantenimiento preventivo de los 1200 horas. Cambio de aceite de motor y filtros completos.",
                    Repuestos = repuestosJson, CostoTotal = 1020.00m, Proveedor = "Volvo Perú S.A.", Responsable = "Ing. Manuel Cáceres",
                    Fecha = DateTime.UtcNow.AddDays(-15), FacturaUrl = "/uploads/facturas/FAC-V001.pdf", FotoUrl = "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400"
                }
            };
            context.Mantenimientos.AddRange(mantenimientos);
            context.SaveChanges();

            // --- 10. Seed GPS Data ---
            var gpsDatas = new List<GpsData>
            {
                new GpsData { EquipoPlaca = "EGS-123", Latitud = -14.0416m, Longitud = -72.2472m, Velocidad = 35.5m, TiempoDetenidoMinutos = 0, MotorEncendido = true },
                new GpsData { EquipoPlaca = "EGS-456", Latitud = -11.5975m, Longitud = -76.1961m, Velocidad = 0m, TiempoDetenidoMinutos = 45, MotorEncendido = false },
                new GpsData { EquipoPlaca = "EXC-789", Latitud = -14.0452m, Longitud = -72.2498m, Velocidad = 0m, TiempoDetenidoMinutos = 2880, MotorEncendido = false },
                new GpsData { EquipoPlaca = "RET-101", Latitud = -12.0651m, Longitud = -75.2048m, Velocidad = 12.0m, TiempoDetenidoMinutos = 0, MotorEncendido = true },
                new GpsData { EquipoPlaca = "CAR-202", Latitud = -12.0673m, Longitud = -75.2012m, Velocidad = 0m, TiempoDetenidoMinutos = 120, MotorEncendido = false }
            };
            context.GpsDatas.AddRange(gpsDatas);
            context.SaveChanges();

            // --- 11. Seed Auditoria ---
            var auditorias = new List<AuditoriaLog>
            {
                new AuditoriaLog { UsuarioId = usuarios.First(u => u.Username == "admin").Id, Accion = "Creación de Base de Datos y Semilla Inicial", Modulo = "Sistema", Detalles = "Poblado de catálogo de usuarios, roles, proyectos y equipos base.", IP = "127.0.0.1", Computadora = "SRV-SIGECOSEM", FechaHora = DateTime.UtcNow.AddMinutes(-5) }
            };
            context.AuditoriaLogs.AddRange(auditorias);
            context.SaveChanges();

            SeedSupplemental(context);
        }
    }
}
