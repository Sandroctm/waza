using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Sigecosem.WebApi.Data;
using Sigecosem.WebApi.Hubs;
using Sigecosem.WebApi.Services;
using Sigecosem.WebApi.Models;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// --- 1. Database Connection (PostgreSQL) ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=db;Database=sigecosem_db;Username=sigecosem_admin;Password=SecretPassword123!;Port=5432";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// --- 2. CORS Policy ---
builder.Services.AddCors(options =>
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .SetIsOriginAllowed(_ => true) // Support SignalR credentials
              .AllowCredentials()));

// --- 3. SignalR (WebSockets) ---
builder.Services.AddSignalR();

// --- 4. JWT Authentication ---
var jwtSettings = builder.Configuration.GetSection("Jwt");
var keyString = jwtSettings["Key"] ?? "SigecosemSuperSecretKeyEnterpriseERP2026!";
var key = Encoding.UTF8.GetBytes(keyString);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "sigecosem-api",
        ValidAudience = jwtSettings["Audience"] ?? "sigecosem-app",
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };

    // Supporting JWT in SignalR WebSocket connections via QueryString
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && (
                path.StartsWithSegments("/notificationHub") ||
                path.StartsWithSegments("/api/checklists/exportar-excel") ||
                path.StartsWithSegments("/api/reportetonelada/exportar-excel")
            ))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// --- 5. Custom Services ---
builder.Services.AddScoped<AuthService>();
builder.Services.AddHostedService<GpsSimulationService>();
builder.Services.AddHostedService<ReporteDiarioService>();

// --- 5.2 Email Service ---
builder.Services.Configure<EmailConfig>(builder.Configuration.GetSection("EmailConfig"));
builder.Services.AddScoped<IEmailService, EmailService>();

// --- 6. Controllers and Swagger ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// --- 7. Database Initialization and Seeding ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        // Wait a few seconds for PG database to boot up if running first time in Compose
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

// --- 8. Request Pipeline ---
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Serve uploads as static files (for invoices and checklist photos)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "uploads")),
    RequestPath = "/uploads"
});

app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");

app.Run();
