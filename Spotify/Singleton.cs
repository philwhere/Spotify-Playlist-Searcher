using System.Net.Http;

namespace Spotify
{
    public sealed class Singleton
    {
        // Explicit static constructor to tell C# compiler  
        // not to mark type as beforefieldinit  
        static Singleton()
        {
        }
        private Singleton()
        {
        }
        public static Singleton Instance { get; } = new Singleton();
        public static HttpClient HttpClient { get; } = new HttpClient();
    }
}
