using System.Threading.Tasks;

namespace Sigecosem.WebApi.Services
{
    public interface IAiService
    {
        Task<string> SendChatMessageAsync(string message);
    }
}
