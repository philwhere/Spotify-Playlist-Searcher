using System.Linq;

namespace Spotify.Models.Responses
{
    public class Track
    {
        public Album album { get; set; }
        public Artist[] artists { get; set; }
        public string artistsString => string.Join(", ", artists.ToList().Select(a => a.name));
        public string name { get; set; }
        public string uri { get; set; }
    }
}