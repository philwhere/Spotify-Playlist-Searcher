using System.Collections.Generic;

namespace Spotify.Models.Responses
{
    public class SpotifyItemResponse<TItem> where TItem : SpotifyItem
    {
        public List<TItem> items { get; set; }
        public string next { get; set; }
        public int limit { get; set; }
        public int total { get; set; }
    }
}