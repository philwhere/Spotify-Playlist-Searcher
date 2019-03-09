using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Spotify.Models;

namespace Spotify.Services
{
    public class SpotifyClient
    {
        private static HttpClient _httpClient;

        public SpotifyClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }
        
        public async Task<SpotifyItemResponse<PlaylistItem>> GetPlaylistsWithSongs(string accessToken)
        {
            var playlists = await GetMyPlaylists(accessToken);
            await PopulateSongsForPlaylists(playlists.items, accessToken);
            return playlists;
        }


        private async Task<SpotifyItemResponse<PlaylistItem>> GetMyPlaylists(string accessToken)
        {
            var url = "https://api.spotify.com/v1/me/playlists?limit=50";
            var playlists = await GetAllPages<PlaylistItem>(url, accessToken);
            return playlists;
        }

        private async Task AddSongsToPlaylistAsync(PlaylistItem playlist, string accessToken)
        {
            var url = $"https://api.spotify.com/v1/playlists/{playlist.id}/tracks";
            var songs = await GetAllPages<SongItem>(url, accessToken);
            playlist.songs = songs;
        }

        private async Task PopulateSongsForPlaylists(IEnumerable<PlaylistItem> playlists, string accessToken)
        {
            var songPopulationTasks = new List<Task>();
            foreach (var playlist in playlists)
                songPopulationTasks.Add(AddSongsToPlaylistAsync(playlist, accessToken));
            await Task.WhenAll(songPopulationTasks);
        }


        private async Task<SpotifyItemResponse<TItem>> GetAllPages<TItem>(string firstPageUrl, string accessToken) where TItem : SpotifyItem
        {
            var response = await Get<SpotifyItemResponse<TItem>>(firstPageUrl, accessToken);
            var nextPageUrl = response.next;

            while (nextPageUrl != null)
            {
                var page = await Get<SpotifyItemResponse<TItem>>(nextPageUrl, accessToken);
                response.items.AddRange(page.items);
                nextPageUrl = page.next;
            }
            return response;
        }

        private async Task<T> Get<T>(string url, string bearerToken = null)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            if (bearerToken != null)
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
            var response = await _httpClient.SendAsync(request);
            return await response.Content.ReadAsAsync<T>();
        }
    }
}
