using Spotify.Models;
using System.Threading.Tasks;

namespace Spotify.Services.Interfaces
{
    public interface ISpotifyClient
    {
        Task<SpotifyItemResponse<PlaylistItem>> GetPlaylistsWithSongs(string accessToken);
        Task RemoveTrackFromPlaylist(string playlistId, string trackUri, string accessToken);
    }
}
