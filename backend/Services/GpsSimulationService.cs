using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sigecosem.WebApi.Data;
using Sigecosem.WebApi.Hubs;
using Sigecosem.WebApi.Models;

namespace Sigecosem.WebApi.Services
{
    public class GpsSimulationService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<GpsSimulationService> _logger;
        private readonly Random _random = new();

        public GpsSimulationService(
            IServiceProvider serviceProvider,
            IHubContext<NotificationHub> hubContext,
            ILogger<GpsSimulationService> logger)
        {
            _serviceProvider = serviceProvider;
            _hubContext = hubContext;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("GPS Simulation Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var activeGpsData = context.GpsDatas.ToList();

                        foreach (var gps in activeGpsData)
                        {
                            var equipo = context.Equipos.FirstOrDefault(e => e.Placa == gps.EquipoPlaca);
                            if (equipo == null) continue;

                            // Only move if equipment is Disponible or Operativo
                            if (equipo.Estado == "Disponible" || equipo.Estado == "Operativo")
                            {
                                gps.MotorEncendido = true;
                                gps.Velocidad = _random.Next(20, 65);
                                gps.TiempoDetenidoMinutos = 0;

                                // Jitter coordinates slightly to simulate driving (roughly 10-30 meters)
                                double latJitter = (_random.NextDouble() - 0.5) * 0.0005;
                                double lngJitter = (_random.NextDouble() - 0.5) * 0.0005;

                                gps.Latitud += (decimal)latJitter;
                                gps.Longitud += (decimal)lngJitter;
                                gps.UltimaActualizacion = DateTime.UtcNow;
                            }
                            else
                            {
                                // Stopped
                                gps.MotorEncendido = false;
                                gps.Velocidad = 0;
                                gps.TiempoDetenidoMinutos += 1;
                                gps.UltimaActualizacion = DateTime.UtcNow;
                            }
                        }

                        if (activeGpsData.Any())
                        {
                            await context.SaveChangesAsync(stoppingToken);

                            // Send updates to all clients via SignalR
                            foreach (var gps in activeGpsData)
                            {
                                await _hubContext.Clients.All.SendAsync("GpsUpdated", new
                                {
                                    placa = gps.EquipoPlaca,
                                    latitud = gps.Latitud,
                                    longitud = gps.Longitud,
                                    velocidad = gps.Velocidad,
                                    motorEncendido = gps.MotorEncendido,
                                    tiempoDetenido = gps.TiempoDetenidoMinutos,
                                    ultimaActualizacion = gps.UltimaActualizacion
                                }, stoppingToken);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in GPS simulation cycle");
                }

                // Simulate GPS heartbeat every 6 seconds
                await Task.Delay(TimeSpan.FromSeconds(6), stoppingToken);
            }

            _logger.LogInformation("GPS Simulation Service stopped.");
        }
    }
}
