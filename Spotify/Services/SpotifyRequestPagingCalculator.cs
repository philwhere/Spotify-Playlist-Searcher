using System;
using System.Collections.Generic;
using System.Web;
using Spotify.Models.Responses;

namespace Spotify.Services
{
    public class SpotifyRequestPagingCalculator
    {
        public IReadOnlyList<string> GetRemainingUrls<TItem>(SpotifyItemResponse<TItem> firstPageResponse) where TItem : SpotifyItem
        {
            if (firstPageResponse.next == null)
                return new string[0];

            var totalNumberOfPages = Math.Ceiling(firstPageResponse.total / (double)firstPageResponse.limit);
            var numberOfPagesRemaining = totalNumberOfPages - 1;

            var remainingUrls = new List<string>();
            var startingOffset = firstPageResponse.limit;

            for (var i = 0; i < numberOfPagesRemaining; i++)
            {
                var offset = i * firstPageResponse.limit + startingOffset;
                var nextPageUrl = GetUrlWithNewOffset(firstPageResponse.next, offset);
                remainingUrls.Add(nextPageUrl);
            }
            return remainingUrls;
        }


        private string GetUrlWithNewOffset(string firstPageNextUrl, int offset)
        {
            var nextUrl = new Uri(firstPageNextUrl);
            var queryParams = HttpUtility.ParseQueryString(nextUrl.Query);
            var nextUrlOffset = queryParams["offset"];
            var newUrl = nextUrl.ToString().Replace($"offset={nextUrlOffset}", $"offset={offset}");
            return newUrl;
        }
    }
}