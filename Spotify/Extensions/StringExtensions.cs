using System.Text.Json;

namespace Spotify.Extensions
{
    public static class StringExtensions
    {
        public static T FromJson<T>(this string json)
        {
            return JsonSerializer.Deserialize<T>(json);
        }
    }
}
