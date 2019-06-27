using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
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


        private string ExtractBearerToken()
        {
            var headerValue = Request.Headers["Authorization"].Single();
            var bearerToken = headerValue.Substring("Bearer ".Length);
            return bearerToken;
        }
    }
}