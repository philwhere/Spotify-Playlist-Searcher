﻿using System;

namespace Spotify.Models
{
    public class SongItem : SpotifyItem
    {
        public DateTime added_at { get; set; }
        public object primary_color { get; set; }
        public Track track { get; set; }
    }
}