using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Spotify.Services;

namespace Spotify.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SpotifyController : ControllerBase
    {
        private static readonly SpotifyClient _spotifyClient = new SpotifyClient();

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