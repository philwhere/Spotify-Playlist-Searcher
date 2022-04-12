using System;
using System.Collections.Generic;
using System.Linq;
using Spotify.Models.Responses;
using static System.Web.HttpUtility;

namespace Spotify.Services
{
    public class SpotifyRequestPagingCalculator
    {
        public IReadOnlyList<string> GetRemainingUrls<TItem>(SpotifyItemResponse<TItem> firstPageResponse) where TItem : SpotifyItem
        {
            var followUrl = firstPageResponse.next;
            if (followUrl == null)
                return Array.Empty<string>();

            var pageSize = firstPageResponse.limit;
            var totalNumberOfPages = (int)Math.Ceiling(firstPageResponse.total / (double)pageSize);
            var numberOfPagesRemaining = totalNumberOfPages - 1;
            var templateUrl = GetTemplateUrl(followUrl);

            var pagesNeeded = Enumerable.Range(1, numberOfPagesRemaining);
            var remainingUrls = pagesNeeded.Select(p => GetUrl(p, templateUrl, pageSize)).ToArray();

            return remainingUrls;
        }


        private string GetUrl(int pageNumber, string templateUrl, int pageSize)
        {
            var offset = pageNumber * pageSize;
            var url = GetUrlWithNewOffset(templateUrl, offset);
            return url;
        }

        private const string TemplateTokenOffset = "{{offset}}";

        private string GetTemplateUrl(string nextPageUrl)
        {
            var uri = new Uri(nextPageUrl);
            var currentOffset = ParseQueryString(uri.Query)["offset"];
            var templateUrl = nextPageUrl.Replace($"offset={currentOffset}", $"offset={TemplateTokenOffset}");
            return templateUrl;
        }

        private string GetUrlWithNewOffset(string templateUrl, int offset)
        {
            var newUrl = templateUrl.Replace(TemplateTokenOffset, offset.ToString());
            return newUrl;
        }
    }
}