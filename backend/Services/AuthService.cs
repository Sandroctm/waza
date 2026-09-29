using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Sigecosem.WebApi.Models;

namespace Sigecosem.WebApi.Services
{
    public class AuthService
    {
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string HashPassword(string password)
        {
            byte[] salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }
            byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations: 100000,
                hashAlgorithm: HashAlgorithmName.SHA256,
                outputLength: 32);
            
            return $"{Convert.ToHexString(salt)}:{Convert.ToHexString(hash)}";
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            if (string.IsNullOrEmpty(hashedPassword) || !hashedPassword.Contains(':'))
            {
                using var sha256 = SHA256.Create();
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                var legacyHash = Convert.ToHexString(hashedBytes).ToLower();
                return legacyHash == hashedPassword.ToLower();
            }

            var parts = hashedPassword.Split(':');
            if (parts.Length != 2) return false;

            try
            {
                byte[] salt = Convert.FromHexString(parts[0]);
                byte[] hash = Convert.FromHexString(parts[1]);

                byte[] testHash = Rfc2898DeriveBytes.Pbkdf2(
                    password,
                    salt,
                    iterations: 100000,
                    hashAlgorithm: HashAlgorithmName.SHA256,
                    outputLength: 32);

                return CryptographicOperations.FixedTimeEquals(hash, testHash);
            }
            catch
            {
                return false;
            }
        }

        public string GenerateToken(Usuario usuario)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var keyString = jwtSettings["Key"] ?? "SigecosemSuperSecretKeyEnterpriseERP2026!";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, usuario.Username),
                new Claim(ClaimTypes.GivenName, usuario.Nombre),
                new Claim(ClaimTypes.Surname, usuario.Apellido),
                new Claim(ClaimTypes.Role, usuario.Rol?.Nombre ?? "Operador"),
                new Claim("Area", usuario.Area?.Nombre ?? ""),
                new Claim("Permisos", usuario.Rol?.Permisos ?? "")
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"] ?? "sigecosem-api",
                audience: jwtSettings["Audience"] ?? "sigecosem-app",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
