using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Spotify.Services.Interfaces;

namespace Spotify.Controllers
{
    [Route("api/[controller]")]
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
            var header = Request.Headers["Authorization"].Single();
            var token = header.Split(' ')[1];
            await _spotifyClient.RemoveTrackFromPlaylist(playlistId, trackUri, token);
            return new OkResult();
        }
    }
}