using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Spotify.Models;
using Spotify.Extensions;
using Microsoft.Extensions.Configuration;

namespace Spotify.Controllers
{
    public class HomeController : Controller
    {
        private IMemoryCache MemoryCache { get; }
        private IConfiguration Configuration { get; }
        private static HttpClient client = new HttpClient();
        
        public HomeController(IMemoryCache memoryCache, IConfiguration configuration)
        {
            MemoryCache = memoryCache;
            Configuration = configuration;
            SetupAuth();
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult About()
        {
            ViewData["Message"] = "Your application description page.";

            return View();
        }

        public IActionResult Contact()
        {
            ViewData["Message"] = "Your contact page.";

            return View();
        }

        public async Task<IActionResult> PlaylistSearch()
        {
            var playlists = await GetPlaylists("phil.where");
            //var playlists = this.GetEmbeddedResourceJsonAs<PlaylistsResponse>("DataDump.json");
            return View(playlists);
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }


        private void SetupAuth()
        {
            var token = GetTokenFromMemory().Result;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        private async Task<TokenResponse> GetToken()
        {
            var request = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", GetAuthorizationHeaderValue());
            var formBody = new List<KeyValuePair<string, string>> { new KeyValuePair<string, string>("grant_type", "client_credentials") };
            request.Content = new FormUrlEncodedContent(formBody);
            var response = await client.SendAsync(request);
            return await response.Content.ReadAsAsync<TokenResponse>();
        }

        private string GetAuthorizationHeaderValue()
        {
            var plainText = $"{Configuration.GetValue<string>("ClientId")}:{Configuration.GetValue<string>("ClientSecret")}";
            var encodedBytes = System.Text.Encoding.Default.GetBytes(plainText);
            var encodedTxt = Convert.ToBase64String(encodedBytes);
            return encodedTxt;
        }

        private async Task<string> GetTokenFromMemory()
        {
            if (!TokenInCache(out TokenResponse token))
            {
                token = await GetToken();
                var cacheEntryOptions = new MemoryCacheEntryOptions().SetSlidingExpiration(TimeSpan.FromSeconds(token.expires_in));
                MemoryCache.Set(nameof(TokenResponse), token, cacheEntryOptions);
            }
            return token.access_token;
        }

        private bool TokenInCache(out TokenResponse token)
        {
            return MemoryCache.TryGetValue(nameof(TokenResponse), out token);
        }

        private async Task<T> Get<T>(string url)
        {
            var response = await client.GetAsync(url);
            return await response.Content.ReadAsAsync<T>();
        }

        private async Task PopulateSongsForPlaylists(PlaylistItem[] playlists)
        {
            var songPopulationTasks = new List<Task>();
            foreach (var playlist in playlists)
                songPopulationTasks.Add(AddSongsToPlaylistAsync(playlist));
            await Task.WhenAll(songPopulationTasks);
        }

        private async Task AddSongsToPlaylistAsync(PlaylistItem playlist)
        {
            var songs = await Get<PlaylistSongsResponse>($"https://api.spotify.com/v1/playlists/{playlist.id}/tracks");
            var nextPage = songs.next;

            while (nextPage != null)
            {
                var currentPageOfSongs = await Get<PlaylistSongsResponse>(nextPage);
                songs.items.AddRange(currentPageOfSongs.items);
                nextPage = currentPageOfSongs.next;
            }

            playlist.songs = songs;
        }

        private async Task<PlaylistsResponse> GetPlaylists(string username, int limit = 50)
        {
            ValidateLimit(limit);
            //var playlists = await Get<PlaylistsResponse>($"https://api.spotify.com/v1/me/playlists?limit={limit}");
            var playlists = await Get<PlaylistsResponse>($"https://api.spotify.com/v1/users/{username}/playlists?offset=0&limit={limit}");
            await PopulateSongsForPlaylists(playlists.items);
            return playlists;
        }

        private void ValidateLimit(int limit)
        {
            if (limit > 50)
                throw new Exception("Limit cannot exceed 50"); //TODO: Paging
        }
    }
}
