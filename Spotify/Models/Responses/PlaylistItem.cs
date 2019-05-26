using Newtonsoft.Json;

namespace Spotify.Models.Responses
{
    public class PlaylistItem : SpotifyItem
    {
        public string id { get; set; }
        public string name { get; set; }
        public Owner owner { get; set; }
        public Tracks tracks { get; set; }
        public string type { get; set; }
        public string uri { get; set; }
        [JsonProperty("public")]
        public bool _public { get; set; }
        public SpotifyItemResponse<SongItem> songs { get; set; }
    }
}
