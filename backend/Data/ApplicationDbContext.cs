using Microsoft.EntityFrameworkCore;
using Sigecosem.WebApi.Models;

namespace Sigecosem.WebApi.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Rol> Roles { get; set; } = null!;
        public DbSet<Area> Areas { get; set; } = null!;
        public DbSet<Proyecto> Proyectos { get; set; } = null!;
        public DbSet<Usuario> Usuarios { get; set; } = null!;
        public DbSet<Equipo> Equipos { get; set; } = null!;
        public DbSet<CheckList> CheckLists { get; set; } = null!;
        public DbSet<Tareo> Tareos { get; set; } = null!;
        public DbSet<Horometro> Horometros { get; set; } = null!;
        public DbSet<Combustible> Combustibles { get; set; } = null!;
        public DbSet<Mantenimiento> Mantenimientos { get; set; } = null!;
        public DbSet<Documento> Documentos { get; set; } = null!;
        public DbSet<Alerta> Alertas { get; set; } = null!;
        public DbSet<GpsData> GpsDatas { get; set; } = null!;
        public DbSet<AuditoriaLog> AuditoriaLogs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure primary keys and naming conventions or relations if needed
            modelBuilder.Entity<Equipo>()
                .HasKey(e => e.Placa);

            // Indexes for faster lookups
            modelBuilder.Entity<Equipo>().HasIndex(e => e.CodigoInterno).IsUnique();
            modelBuilder.Entity<Usuario>().HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<CheckList>().HasIndex(c => new { c.EquipoPlaca, c.Semana, c.Anio });
            modelBuilder.Entity<Tareo>().HasIndex(t => t.Fecha);
            modelBuilder.Entity<Horometro>().HasIndex(h => h.Fecha);
            modelBuilder.Entity<Combustible>().HasIndex(c => c.Fecha);
            modelBuilder.Entity<Mantenimiento>().HasIndex(m => m.Fecha);
            modelBuilder.Entity<AuditoriaLog>().HasIndex(a => a.FechaHora);

            // Handle cascading behavior
            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Rol)
                .WithMany()
                .HasForeignKey(u => u.RolId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Equipo>()
                .HasOne(e => e.Proyecto)
                .WithMany()
                .HasForeignKey(e => e.ProyectoId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Equipo>()
                .HasOne(e => e.Area)
                .WithMany()
                .HasForeignKey(e => e.AreaId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<CheckList>()
                .HasOne(c => c.Equipo)
                .WithMany()
                .HasForeignKey(c => c.EquipoPlaca)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Tareo>()
                .HasOne(t => t.Equipo)
                .WithMany()
                .HasForeignKey(t => t.EquipoPlaca)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
