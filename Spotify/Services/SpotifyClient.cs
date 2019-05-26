using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Spotify.Configuration;
using Spotify.Extensions;
using Spotify.Models.Payloads;
using Spotify.Models.Responses;
using Spotify.Services.Interfaces;

namespace Spotify.Services
{
    public class SpotifyClient : ISpotifyClient
    {
        private readonly SpotifyClientConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public SpotifyClient(IOptions<SpotifyClientConfiguration> configuration, HttpClient httpClient)
        {
            _configuration = configuration.Value;
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
        }
        
        public async Task<List<PlaylistItem>> GetMyPlaylistsWithSongs(string accessToken)
        {
            var playlists = await GetMyPlaylists(accessToken);
            await PopulateSongsForPlaylists(playlists, accessToken);
            return playlists;
        }

        public async Task<List<PlaylistItem>> GetAllPlaylistsWithSongs(string accessToken)
        {
            var playlists = await GetAllPlaylists(accessToken);
            await PopulateSongsForPlaylists(playlists, accessToken);
            return playlists;
        }

        public async Task RemoveTrackFromPlaylist(string playlistId, string trackUri, string accessToken)
        {
            var url = $"https://api.spotify.com/v1/playlists/{playlistId}/tracks";
            var payload = new { tracks = new dynamic[] { new { uri = trackUri } } };
            var response = await _httpClient.DeleteWithToken<dynamic>(url, payload, accessToken);
        }

        public async Task<AuthorizationCodeResult> GetAuthorizationByCode(string authorizationCode, string redirectUri)
        {
            var url = $"https://accounts.spotify.com/api/token";
            var payload = new AuthorizationTokenPayload(authorizationCode, redirectUri, 
                _configuration.ClientId, _configuration.ClientSecret);
            var response = await _httpClient.PostFormWithToken<AuthorizationCodeResult>(url, payload);
            return response;
        }

        public async Task<RefreshTokenResult> GetTokenByRefresh(string refreshToken)
        {
            var url = $"https://accounts.spotify.com/api/token";
            var payload = new RefreshTokenPayload(refreshToken, 
                _configuration.ClientId, _configuration.ClientSecret);
            var response = await _httpClient.PostFormWithToken<RefreshTokenResult>(url, payload);
            return response;
        }

        public async Task<Profile> GetProfile(string accessToken)
        {
            var url = "https://api.spotify.com/v1/me";
            var response = await _httpClient.GetWithToken<Profile>(url, accessToken);
            return response;
        }


        private async Task<List<PlaylistItem>> GetMyPlaylists(string accessToken)
        {
            var profile = await GetProfile(accessToken);
            var allPlaylists = await GetAllPlaylists(accessToken);
            return allPlaylists.FindAll(p => p.owner.id == profile.id);
        }

        private async Task<List<PlaylistItem>> GetAllPlaylists(string accessToken)
        {
            var url = "https://api.spotify.com/v1/me/playlists?limit=50";
            var playlists = await GetAllPages<PlaylistItem>(url, accessToken);
            return playlists.items;
        }

        private async Task AddSongsToPlaylist(PlaylistItem playlist, string accessToken)
        {
            var url = $"https://api.spotify.com/v1/playlists/{playlist.id}/tracks";
            var songs = await GetAllPages<SongItem>(url, accessToken);
            playlist.songs = songs;
        }

        private async Task PopulateSongsForPlaylists(List<PlaylistItem> playlists, string accessToken)
        {
            var songPopulationTasks = new List<Task>();
            foreach (var playlist in playlists)
                songPopulationTasks.Add(AddSongsToPlaylist(playlist, accessToken));
            await Task.WhenAll(songPopulationTasks);
        }

        private async Task<SpotifyItemResponse<TItem>> GetAllPages<TItem>(string firstPageUrl, string accessToken) where TItem : SpotifyItem
        {
            var response = await _httpClient.GetWithToken<SpotifyItemResponse<TItem>>(firstPageUrl, accessToken);
            var nextPageUrl = response.next;

            while (nextPageUrl != null)
            {
                var page = await _httpClient.GetWithToken<SpotifyItemResponse<TItem>>(nextPageUrl, accessToken);
                response.items.AddRange(page.items);
                nextPageUrl = page.next;
            }
            return response;
        }
    }
}
