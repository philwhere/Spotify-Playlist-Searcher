using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Caching;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Spotify.Extensions;
using Spotify.Models.Responses;
using Spotify.Services.Interfaces;

namespace Spotify.Controllers.WebApi
{
    [Route("api/spotify")]
    [ApiController]
    public class SpotifyController : ControllerBase
    {
        private readonly ISpotifyClient _spotifyClient;

        public SpotifyController(ISpotifyClient spotifyClient)
        {
            _spotifyClient = spotifyClient;
        }

        [HttpDelete]
        [Route("playlists/{playlistId}/tracks/{trackUri}")]
        public async Task<IActionResult> RemoveTrackFromPlaylist(string playlistId, string trackUri)
        {
            var token = ExtractBearerToken();
            await _spotifyClient.RemoveTrackFromPlaylist(playlistId, trackUri, token);
            return new OkResult();
        }

        [HttpGet]
        [Route("token")]
        public async Task<IActionResult> GetTokenByRefresh(string refreshToken)
        {
            var auth = await _spotifyClient.GetTokenByRefresh(refreshToken);
            return new OkObjectResult(auth);
        }

        [HttpGet]
        [Route("playlists")]
        public async Task<IActionResult> GetMyPlaylistsWithSongs(string accessToken, string debugCacheKey = "1")
        {
#if DEBUG
            var playlists = await GetDebugPlaylists(accessToken, debugCacheKey);
#else
            var playlists = await _spotifyClient.GetMyPlaylistsWithSongs(accessToken);
#endif
            return new OkObjectResult(playlists);
        }


        private string ExtractBearerToken()
        {
            var headerValue = Request.Headers["Authorization"].Single();
            var bearerToken = headerValue.Substring("Bearer ".Length);
            return bearerToken;
        }

        private async Task<List<PlaylistItem>> GetDebugPlaylists(string accessToken, string debugCacheKey)
        {
            var cache = new FileCache();
            if (cache[debugCacheKey] != null)
                return ((string)cache[debugCacheKey]).FromJson<List<PlaylistItem>>();

            var playlists = await _spotifyClient.GetMyPlaylistsWithSongs(accessToken);
            cache.Add(debugCacheKey, playlists.ToJson(), DateTimeOffset.Now.AddDays(1));
            return playlists;
        }
    }
}