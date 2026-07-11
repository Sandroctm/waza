using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Sigecosem.WebApi.Models;

namespace Sigecosem.WebApi.Services
{
    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly AiConfig _config;

        public AiService(HttpClient httpClient, IOptions<AiConfig> config)
        {
            _httpClient = httpClient;
            _config = config.Value;

            if (!string.IsNullOrEmpty(_config.BaseUrl))
            {
                var baseUrl = _config.BaseUrl.EndsWith("/") ? _config.BaseUrl : _config.BaseUrl + "/";
                _httpClient.BaseAddress = new Uri(baseUrl);
            }

            if (!string.IsNullOrEmpty(_config.ApiKey))
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _config.ApiKey);
            }
        }

        public async Task<string> SendChatMessageAsync(string message)
        {
            var requestBody = new
            {
                model = _config.ModelName,
                messages = new[]
                {
                    new { role = "system", content = "Eres un asistente virtual experto para el sistema de gestión de flota de Sigecosem. Eres amable, conciso y profesional. Respondes en español." },
                    new { role = "user", content = message }
                },
                temperature = 0.7
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("chat/completions", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new Exception($"Error from AI API: {response.StatusCode} - {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var jsonDoc = JsonDocument.Parse(responseContent);

            try
            {
                var reply = jsonDoc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return reply ?? "Sin respuesta.";
            }
            catch (Exception ex)
            {
                throw new Exception($"Error parsing AI response: {ex.Message}. Response: {responseContent}");
            }
        }
    }
}
