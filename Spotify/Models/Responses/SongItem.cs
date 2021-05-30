using System;

namespace Spotify.Models.Responses
{
    public class SongItem : SpotifyItem
    {
        public DateTime added_at { get; set; }
        public Track track { get; set; }
    }
}