using Spotify.Services;
using System.Reflection;

namespace Spotify.Extensions
{
    public static class ObjectEmbeddedResourceReaderExtension
    {
        public static string GetEmbeddedResourceAsString(this object obj, string partialName, Assembly assembly = null)
        {
            if (assembly == null)
                assembly = Assembly.GetAssembly(obj.GetType());

            return EmbeddedResourceReader.GetAsString(partialName, assembly);
        }

        public static T GetEmbeddedResourceJsonAs<T>(this object obj, string partialName, Assembly assembly = null)
        {
            if (assembly == null)
                assembly = Assembly.GetAssembly(obj.GetType());

            return EmbeddedResourceReader.GetJsonAs<T>(partialName, assembly);
        }
    }
}
