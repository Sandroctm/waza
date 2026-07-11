namespace Sigecosem.WebApi.Models
{
    public class AiConfig
    {
        public string BaseUrl { get; set; } = "https://api.groq.com/openai/v1/";
        public string ApiKey { get; set; } = string.Empty;
        public string ModelName { get; set; } = "llama3-8b-8192";
    }
}
