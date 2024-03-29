﻿using Spotify.Models.Responses;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Spotify.Services.Interfaces
{
    public interface ISpotifyClient
    {
        Task<List<PlaylistItem>> GetMyPlaylists(string accessToken, bool includeSongs = true);
        Task<List<PlaylistItem>> GetPlaylistsWithSongs(string accessToken, IEnumerable<string> playlistUris);
        Task<List<PlaylistItem>> GetAllPlaylistsWithSongs(string accessToken);
        Task RemoveTrackFromPlaylist(string playlistId, string trackUri, string accessToken);
        Task<AuthorizationCodeResult> GetAuthorizationByCode(string authorizationCode, string redirectUri);
        Task<RefreshTokenResult> GetTokenByRefresh(string refreshToken);
        Task<SpotifyItemResponse<SongItem>> GetAllLibrarySongs(string accessToken);
    }
}
