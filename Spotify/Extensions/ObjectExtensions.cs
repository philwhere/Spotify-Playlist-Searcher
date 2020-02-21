using System.Text.Json;

namespace Spotify.Extensions
{
    public static class ObjectExtensions
    {
        public static string ToJson(this object value)
        {
            return JsonSerializer.Serialize(value);
        }
    }
}
