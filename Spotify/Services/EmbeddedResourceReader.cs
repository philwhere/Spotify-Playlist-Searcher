using Newtonsoft.Json;
using System;
using System.IO;
using System.Linq;
using System.Reflection;

namespace Spotify.Services
{
    public static class EmbeddedResourceReader
    {
        public static string GetAsString(string name, Assembly assembly)
        {
            using (var stream = Get(name, assembly))
            using (var reader = new StreamReader(stream))
                return reader.ReadToEnd();
        }

        public static T GetJsonAs<T>(string name, Assembly assembly)
        {
            var text = GetAsString(name, assembly);
            return JsonConvert.DeserializeObject<T>(text);
        }

        private static Stream Get(string name, Assembly assembly)
        {
            if (string.IsNullOrWhiteSpace(name))
                return null;

            if (assembly == null)
                assembly = Assembly.GetCallingAssembly();

            var names = assembly.GetManifestResourceNames();
            var resourceName =
                names.Single(n =>
                    n.Equals(name, StringComparison.InvariantCultureIgnoreCase) ||
                    n.EndsWith("." + name, StringComparison.InvariantCultureIgnoreCase) ||
                    Path.GetFileNameWithoutExtension(n).EndsWith("." + name, StringComparison.InvariantCultureIgnoreCase));

            return assembly.GetManifestResourceStream(resourceName);
        }
    }
}
