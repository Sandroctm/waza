using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sigecosem.WebApi.Data;

namespace Sigecosem.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditoriaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuditoriaController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult Get()
        {
            var logs = _context.AuditoriaLogs
                .Include(l => l.Usuario)
                .OrderByDescending(l => l.FechaHora)
                .Take(200) // Cap to avoid massive load, showing recent 200 audits
                .ToList();
            return Ok(logs);
        }
    }
}
