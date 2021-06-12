using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Spotify.Models.Responses;
using Spotify.Services;
using Xunit;

namespace Spotify.Tests
{
    public class SpotifyRequestPagingCalculatorTests
    {
        private readonly SpotifyRequestPagingCalculator _pagingCalculator;

        public SpotifyRequestPagingCalculatorTests()
        {
            _pagingCalculator = new SpotifyRequestPagingCalculator();
        }


        private const string NextUrlWithoutParams = "https://api.spotify.com/v1/playlists/7fq8B138ulrc1KUSbc30r9/tracks";
        private readonly SpotifyItemResponse<SongItem> _noPagesNeededResponse = new SpotifyItemResponse<SongItem>
        {
            items = new SongItem[12].ToList(),
            next = null,
            limit = 100,
            total = 12
        };
        private readonly SpotifyItemResponse<SongItem> _onePageNeeded = new SpotifyItemResponse<SongItem>
        {
            items = new SongItem[100].ToList(),
            next = NextUrlWithoutParams + "?offset=100&limit=100",
            limit = 100,
            total = 120
        };
        private readonly SpotifyItemResponse<SongItem> _fourPagesNeeded = new SpotifyItemResponse<SongItem>
        {
            items = new SongItem[100].ToList(),
            next = NextUrlWithoutParams + "?offset=100&limit=100",
            limit = 100,
            total = 420
        };
        private readonly IReadOnlyList<string> _expectedOnePageUrl = new List<string>
        {
            NextUrlWithoutParams + "?offset=100&limit=100"
        };
        private readonly IReadOnlyList<string> _expectedFourPageUrls = new List<string>
        {
            NextUrlWithoutParams + "?offset=100&limit=100",
            NextUrlWithoutParams + "?offset=200&limit=100",
            NextUrlWithoutParams + "?offset=300&limit=100",
            NextUrlWithoutParams + "?offset=400&limit=100"
        };

        [Fact]
        public void GivenNoNextUrl_ThenReturnEmpty()
        {
            var urls = _pagingCalculator.GetRemainingUrls(_noPagesNeededResponse);
            urls.Should().BeEmpty();
        }

        [Fact]
        public void GivenOnePageNeeded_ThenReturnOneUrls()
        {
            var urls = _pagingCalculator.GetRemainingUrls(_fourPagesNeeded);
            urls.Should().HaveCount(4);
            urls.Should().BeEquivalentTo(_expectedFourPageUrls, options => options.WithStrictOrdering());
        }

        [Fact]
        public void GivenFourPagesNeeded_ThenReturnFourUrls()
        {
            var urls = _pagingCalculator.GetRemainingUrls(_onePageNeeded);
            urls.Should().HaveCount(1);
            urls.Should().BeEquivalentTo(_expectedOnePageUrl, options => options.WithStrictOrdering());
        }
    }
}
