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
        private string AccessToken => ExtractBearerToken();

        public SpotifyController(ISpotifyClient spotifyClient)
        {
            _spotifyClient = spotifyClient;
        }

        [HttpDelete]
        [Route("playlists/{playlistId}/tracks/{trackUri}")]
        public async Task<IActionResult> RemoveTrackFromPlaylist(string playlistId, string trackUri)
        {
            await _spotifyClient.RemoveTrackFromPlaylist(playlistId, trackUri, AccessToken);
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
        public async Task<IActionResult> GetMyPlaylistsWithSongs(string debugCacheKey = "1")
        {
            async Task<List<PlaylistItem>> GetPlaylists() => await _spotifyClient.GetMyPlaylists(AccessToken);
#if DEBUG
            var playlists = await GetWithDebugCaching(GetPlaylists, nameof(GetMyPlaylistsWithSongs), debugCacheKey);
#else
            var playlists = await GetPlaylists();
#endif
            return new OkObjectResult(playlists);
        }

        [HttpPost]
        [Route("playlists")]
        public async Task<IActionResult> GetSelectedPlaylistsWithSongs(IEnumerable<string> playlistIds)
        {
            var playlists = await _spotifyClient.GetPlaylistsWithSongs(AccessToken, playlistIds);
            return new OkObjectResult(playlists);
        }

        [HttpGet]
        [Route("playlists/{playlistId}/exists")]
        public async Task<IActionResult> CheckPlaylistExists(string playlistId)
        {
            var myPlaylists = await _spotifyClient.GetMyPlaylists(AccessToken, false);
            var exists = myPlaylists.Any(p => p.id == playlistId);
            return Ok(exists);
        }

        [HttpGet]
        [Route("liked")]
        public async Task<IActionResult> GetLibrarySongs(string debugCacheKey = "1")
        {
            async Task<SpotifyItemResponse<SongItem>> GetSongs() => await _spotifyClient.GetAllLibrarySongs(AccessToken);
#if DEBUG
            var librarySongs = await GetWithDebugCaching(GetSongs, nameof(GetLibrarySongs), debugCacheKey);
#else
            var librarySongs = await GetSongs();
#endif
            return new OkObjectResult(librarySongs);
        }

        [HttpGet]
        [Route("authorize")]
        public async Task<IActionResult> GetAuthorizationByCode(string code, string redirectUri)
        {
            var authorization = await _spotifyClient.GetAuthorizationByCode(code, redirectUri);
            return new OkObjectResult(authorization);
        }


        private string ExtractBearerToken()
        {
            var headerValue = Request.Headers["Authorization"].Single();
            var bearerToken = headerValue.Substring("Bearer ".Length);
            return bearerToken;
        }

        private async Task<T> GetWithDebugCaching<T>(Func<Task<T>> get, string methodName, string debugCacheKey)
        {
            debugCacheKey = methodName + debugCacheKey;
            var cache = new FileCache();
            if (cache[debugCacheKey] != null)
                return ((string)cache[debugCacheKey]).FromJson<T>();

            var result = await get.Invoke();
            cache.Add(debugCacheKey, result.ToJson(), DateTimeOffset.Now.AddDays(1));
            return result;
        }
    }
}