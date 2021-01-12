using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Spotify.Configuration;
using Spotify.Models;
using System.Diagnostics;
using System.Threading.Tasks;

namespace Spotify.Controllers
{
    public class HomeController : Controller
    {
        private readonly SpotifyClientConfiguration _configuration;

        public HomeController(IOptions<SpotifyClientConfiguration> configuration)
        {
            _configuration = configuration.Value;
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

        public IActionResult Contact()
        {
            return View();
        }

        public async Task<IActionResult> PlaylistSearch()
        {
            return View();
        }

        public async Task<IActionResult> RecentlyPlayed()
        {
            return View();
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
