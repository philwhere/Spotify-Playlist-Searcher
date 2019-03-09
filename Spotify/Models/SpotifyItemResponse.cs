using System.Collections.Generic;

namespace Spotify.Models
{
    public class SpotifyItemResponse<TItem> where TItem : SpotifyItem
    {
        public List<TItem> items { get; set; }
        public string next { get; set; }
    }
}