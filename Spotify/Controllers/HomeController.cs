using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Spotify.Configuration;
using Spotify.Models;
using Spotify.Services.Interfaces;
using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Spotify.Extensions; //Dev
using Spotify.Models.Responses; //Dev
using System.Collections.Generic; //Dev

namespace Spotify.Controllers
{
    public class HomeController : Controller
    {
        private readonly SpotifyClientConfiguration _configuration;
        private readonly ISpotifyClient _spotifyClient;

        public HomeController(IOptions<SpotifyClientConfiguration> configuration, ISpotifyClient spotifyClient)
        {
            _configuration = configuration.Value;
            _spotifyClient = spotifyClient;
        }

        public IActionResult Index()
        {
            ViewBag.ClientId = _configuration.ClientId;
            return View();
        }

        public IActionResult About()
        {
            return View();
        }

        public async Task<IActionResult> AuthCodeRedirect(string code, string redirect_uri)
        {
            var authorization = await _spotifyClient.GetAuthorizationByCode(code, redirect_uri);
            var expiry = DateTimeOffset.Now.AddSeconds(-1).ToUnixTimeMilliseconds() + authorization.expires_in * 1000;
            return RedirectToAction("PlaylistSearch", new 
                { authorization.access_token, expiry, authorization.refresh_token });
        }

        public IActionResult Contact()
        {
            return View();
        }

        public async Task<IActionResult> PlaylistSearch(string access_token)
        {
            if (string.IsNullOrEmpty(access_token))
                return RedirectToAction("Index");
            try
            {
#if DEBUG
                var playlists = this.GetEmbeddedResourceJsonAs<List<PlaylistItem>>("DataDump.json");
#else
                var playlists = await _spotifyClient.GetMyPlaylistsWithSongs(access_token);
#endif
                return View(playlists);
            }
            catch
            {
                return RedirectToAction("Index");
            }
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
    }
}
