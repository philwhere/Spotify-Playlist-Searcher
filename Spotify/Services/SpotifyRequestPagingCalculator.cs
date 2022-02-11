using System;
using System.Collections.Generic;
using Spotify.Models.Responses;
using static System.Web.HttpUtility;

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

            var templateUrl = GetTemplateUrl(firstPageResponse.next);

            for (var i = 0; i < numberOfPagesRemaining; i++)
            {
                var offset = (i + 1) * firstPageResponse.limit;
                var nextPageUrl = GetUrlWithNewOffset(templateUrl, offset);
                remainingUrls.Add(nextPageUrl);
            }
            return remainingUrls;
        }


        private string GetTemplateUrl(string firstPageResponseNextUrl)
        {
            var uri = new Uri(firstPageResponseNextUrl);
            var currentOffset = ParseQueryString(uri.Query)["offset"];
            var templateUrl = $"{uri}".Replace($"offset={currentOffset}", "offset={{offset}}");
            return templateUrl;
        }

        private string GetUrlWithNewOffset(string templateUrl, int offset)
        {
            var newUrl = templateUrl.Replace("{{offset}}", $"{offset}");
            return newUrl;
        }
    }
}