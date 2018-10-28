using System;
using System.Collections.Generic;
using System.Linq;

namespace Spotify.Models
{
    public class PlaylistSongsResponse
    {
        public List<SongItem> items { get; set; }
        public string next { get; set; }
        public int total { get; set; }
    }

    public class SongItem
    {
        public DateTime added_at { get; set; }
        public object primary_color { get; set; }
        public Track track { get; set; }
    }

    public class Track
    {
        public Album album { get; set; }
        public Artist[] artists { get; set; }
        public string artistsString => string.Join(", ", artists.ToList().Select(a => a.name));
        public string name { get; set; }
    }

    public class Album
    {
        public string name { get; set; }
    }

    public class Artist
    {
        public string name { get; set; }
    }
}
