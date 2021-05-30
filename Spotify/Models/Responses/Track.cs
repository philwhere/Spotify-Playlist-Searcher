using System.Linq;

namespace Spotify.Models.Responses
{
    public class Track
    {
        public Album album { get; set; }
        public Artist[] artists { get; set; }
        public string artistsString => string.Join(", ", artists.ToList().Select(a => a.name));
        //public int disc_number { get; set; }
        //public int duration_ms { get; set; }
        //public bool episode { get; set; }
        //public bool _explicit { get; set; }
        //public string href { get; set; }
        //public string id { get; set; }
        //public bool is_local { get; set; }
        public string name { get; set; }
        //public int popularity { get; set; }
        //public string preview_url { get; set; }
        //public int track_number { get; set; }
        public string uri { get; set; }
    }
}