namespace Spotify.Models
{
    public class PlaylistsResponse
    {
        public string href { get; set; }
        public PlaylistItem[] items { get; set; }
        public int limit { get; set; }
        public string next { get; set; }
        public int total { get; set; }
    }

    public class PlaylistItem
    {
        public string id { get; set; }
        public string name { get; set; }
        public Tracks tracks { get; set; }
        public string type { get; set; }
        public string uri { get; set; }
        public PlaylistSongsResponse songs { get; set; }
    }

    public class Tracks
    {
        public string href { get; set; }
        public int total { get; set; }
    }
}
