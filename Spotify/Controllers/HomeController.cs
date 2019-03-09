using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Spotify.Models;
using Spotify.Services;
using System.Diagnostics;
using System.Net.Http;
using System.Threading.Tasks;

namespace Spotify.Controllers
{
    public class HomeController : Controller
    {
        private IMemoryCache MemoryCache { get; }
        private IConfiguration Configuration { get; }
        private static HttpClient HttpClient = new HttpClient();
        private static SpotifyClient SpotifyClient = new SpotifyClient(HttpClient);
        
        public HomeController(IMemoryCache memoryCache, IConfiguration configuration)
        {
            MemoryCache = memoryCache;
            Configuration = configuration;
        }

        public IActionResult Index()
        {
            ViewBag.ClientId = Configuration.GetValue<string>("ClientId");
            ViewBag.ClientSecret = Configuration.GetValue<string>("ClientSecret");
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

        public async Task<IActionResult> PlaylistSearch(string accessToken)
        {
            if (string.IsNullOrEmpty(accessToken))
                return RedirectToAction("Index");
            var playlists = await SpotifyClient.GetPlaylistsWithSongs(accessToken);
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
    }
}
