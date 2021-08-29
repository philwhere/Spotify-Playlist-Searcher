using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using MoreLinq.Extensions;
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
        private readonly SpotifyRequestPagingCalculator _pagingCalculator;

        public SpotifyClient(IOptions<SpotifyClientConfiguration> configuration, HttpClient httpClient, SpotifyRequestPagingCalculator pagingCalculator)
        {
            _configuration = configuration.Value;
            _httpClient = httpClient;
            _pagingCalculator = pagingCalculator;
            _httpClient.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
        }
        
        public async Task<List<PlaylistItem>> GetMyPlaylists(string accessToken, bool includeSongs)
        {
            var myPlaylists = await GetMyPlaylists(accessToken);
            if (includeSongs)
                await PopulateSongsForPlaylists(myPlaylists, accessToken, 3);
            return myPlaylists;
        }

        public async Task<List<PlaylistItem>> GetPlaylistsWithSongs(string accessToken, IEnumerable<string> playlistIds)
        {
            var playlists = await GetPlaylists(accessToken, playlistIds.ToList());
            await PopulateSongsForPlaylists(playlists, accessToken, 6);
            return playlists;
        }

        // Not used
        public async Task<List<PlaylistItem>> GetAllPlaylistsWithSongs(string accessToken)
        {
            var playlists = await GetAllPlaylists(accessToken);
            await PopulateSongsForPlaylists(playlists, accessToken, 3);
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
            const string url = "https://accounts.spotify.com/api/token";
            var payload = new AuthorizationTokenPayload(authorizationCode, redirectUri, 
                _configuration.ClientId, _configuration.ClientSecret);
            var response = await _httpClient.PostFormWithToken<AuthorizationCodeResult>(url, payload);
            return response;
        }

        public async Task<RefreshTokenResult> GetTokenByRefresh(string refreshToken)
        {
            const string url = "https://accounts.spotify.com/api/token";
            var payload = new RefreshTokenPayload(refreshToken, 
                _configuration.ClientId, _configuration.ClientSecret);
            var response = await _httpClient.PostFormWithToken<RefreshTokenResult>(url, payload);
            return response;
        }

        public async Task<SpotifyItemResponse<SongItem>> GetAllLibrarySongs(string accessToken)
        {
            const string url = "https://api.spotify.com/v1/me/tracks?limit=50";
            var songs = await GetAllPages<SongItem>(url, accessToken, 10);
            return songs;
        }


        private async Task<List<PlaylistItem>> GetPlaylists(string accessToken, IReadOnlyCollection<string> playlistIds)
        {
            if (playlistIds.Count < 10)
            {
                var getPlaylistTasks = playlistIds.Select(id => GetPlaylist(accessToken, id));
                return (await Task.WhenAll(getPlaylistTasks)).ToList();
            }
            var myPlaylists = await GetMyPlaylists(accessToken);
            return myPlaylists.Where(p => playlistIds.Contains(p.id)).ToList();
        }

        private async Task<Profile> GetProfile(string accessToken)
        {
            const string url = "https://api.spotify.com/v1/me";
            var response = await _httpClient.GetWithToken<Profile>(url, accessToken);
            return response;
        }

        private async Task<List<PlaylistItem>> GetMyPlaylists(string accessToken)
        {
            var profile = GetProfile(accessToken);
            var allPlaylists = GetAllPlaylists(accessToken);
            await Task.WhenAll(profile, allPlaylists);

            return allPlaylists.Result.FindAll(p => p.owner.id == profile.Result.id);
        }

        private async Task<PlaylistItem> GetPlaylist(string accessToken, string playlistId)
        {
            var url = $"https://api.spotify.com/v1/playlists/{playlistId}";
            var playlist = await _httpClient.GetWithToken<PlaylistItem>(url, accessToken);
            return playlist;
        }

        private async Task<List<PlaylistItem>> GetAllPlaylists(string accessToken)
        {
            const string url = "https://api.spotify.com/v1/me/playlists?limit=50";
            var playlists = await GetAllPages<PlaylistItem>(url, accessToken, 3);
            return playlists.items;
        }

        private async Task AddSongsToPlaylist(PlaylistItem playlist, string accessToken, int parallelRequestSize)
        {
            var url = $"https://api.spotify.com/v1/playlists/{playlist.id}/tracks";
            var songs = await GetAllPages<SongItem>(url, accessToken, parallelRequestSize);
            playlist.songs = songs;
        }

        private async Task PopulateSongsForPlaylists(List<PlaylistItem> playlists, string accessToken, int parallelRequestSize = 1)
        {
            var songPopulationTasks = playlists.Select(p => AddSongsToPlaylist(p, accessToken, parallelRequestSize));
            await Task.WhenAll(songPopulationTasks);
        }

        private async Task<SpotifyItemResponse<TItem>> GetAllPages<TItem>(string firstPageUrl, string accessToken, int batchSize) where TItem : SpotifyItem
        {
            var firstPageResponse = await _httpClient.GetWithToken<SpotifyItemResponse<TItem>>(firstPageUrl, accessToken);

            var remainingUrls = _pagingCalculator.GetRemainingUrls(firstPageResponse);

            var batches = remainingUrls.Batch(batchSize);
            foreach (var batch in batches)
            {
                var pages = await GetPagesInBatch<TItem>(accessToken, batch);
                var items = pages.SelectMany(p => p.items);
                firstPageResponse.items.AddRange(items);
            }

            return firstPageResponse;
        }

        private async Task<List<SpotifyItemResponse<TItem>>> GetPagesInBatch<TItem>(string accessToken,
            IEnumerable<string> batchUrls) where TItem : SpotifyItem
        {
            var getPagesTasks = batchUrls.Select(url => _httpClient.GetWithToken<SpotifyItemResponse<TItem>>(url, accessToken));
            var pages = (await Task.WhenAll(getPagesTasks)).ToList();
            return pages;
        }
    }
}
