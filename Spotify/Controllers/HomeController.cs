using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Spotify.Models;
using Spotify.Services;
using System.Diagnostics;
using System.Threading.Tasks;

namespace Spotify.Controllers
{
    public class HomeController : Controller
    {
        private IConfiguration Configuration { get; }
        private static readonly SpotifyClient SpotifyClient = new SpotifyClient();

        public HomeController(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IActionResult Index()
        {
            ViewBag.ClientId = Configuration.GetValue<string>("Values:ClientId");
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

        public async Task<IActionResult> PlaylistSearch(string access_token, string redirect_uri)
        {
            if (string.IsNullOrEmpty(access_token))
                return RedirectToAction("Index");
            try
            {
                var playlists = (await SpotifyClient.GetPlaylistsWithSongs(access_token)).items;
                //var playlists = this.GetEmbeddedResourceJsonAs<List<PlaylistItem>>("DataDump.json");
                return View(playlists);
            }
            catch // TODO: Handle expired tokens better
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
