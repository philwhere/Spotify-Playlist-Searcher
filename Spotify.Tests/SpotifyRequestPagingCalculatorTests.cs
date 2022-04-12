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

        [Fact]
        public void GetRemainingUrls_GivenNoNextUrl_ThenReturnNoUrls()
        {
            var urls = _pagingCalculator.GetRemainingUrls(_nullNextResponse);
            urls.Should().BeEmpty();
        }

        [Fact]
        public void GetRemainingUrls_GivenOnePageNeeded_ThenReturnOneUrl()
        {
            var urls = _pagingCalculator.GetRemainingUrls(_120Total100LimitResponse);
            urls.Should().HaveCount(1);
            urls.Should().BeEquivalentTo(_expectedUrlsOnePage, options => options.WithStrictOrdering());
        }

        [Fact]
        public void GetRemainingUrls_GivenFourPagesNeeded_ThenReturnFourUrls()
        {
            var urls = _pagingCalculator.GetRemainingUrls(_220Total50LimitResponse);
            urls.Should().HaveCount(4);
            urls.Should().BeEquivalentTo(_expectedUrlsFourPages, options => options.WithStrictOrdering());
        }


        private const string NextUrlWithoutParams = "https://api.spotify.com/v1/playlists/7fq8B138ulrc1KUSbc30r9/tracks";
        private readonly SpotifyItemResponse<SongItem> _nullNextResponse = new SpotifyItemResponse<SongItem>
        {
            items = new SongItem[12].ToList(),
            next = null,
            limit = 100,
            total = 12
        };
        private readonly SpotifyItemResponse<SongItem> _120Total100LimitResponse = new SpotifyItemResponse<SongItem>
        {
            items = new SongItem[100].ToList(),
            next = NextUrlWithoutParams + "?offset=100&limit=100",
            limit = 100,
            total = 120
        };
        private readonly SpotifyItemResponse<SongItem> _220Total50LimitResponse = new SpotifyItemResponse<SongItem>
        {
            items = new SongItem[50].ToList(),
            next = NextUrlWithoutParams + "?offset=50&limit=50",
            limit = 50,
            total = 220
        };
        private readonly IReadOnlyList<string> _expectedUrlsOnePage = new List<string>
        {
            NextUrlWithoutParams + "?offset=100&limit=100"
        };
        private readonly IReadOnlyList<string> _expectedUrlsFourPages = new List<string>
        {
            NextUrlWithoutParams + "?offset=50&limit=50",
            NextUrlWithoutParams + "?offset=100&limit=50",
            NextUrlWithoutParams + "?offset=150&limit=50",
            NextUrlWithoutParams + "?offset=200&limit=50"
        };
    }
}
