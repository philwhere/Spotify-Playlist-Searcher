using Newtonsoft.Json;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace Spotify.Extensions
{
    public static class HttpClientExtensions
    {
        public static async Task<T> GetWithToken<T>(this HttpClient httpClient,
            string url, string accessToken = null)
        {
            return await SendWithToken<T>(httpClient, url, HttpMethod.Get, accessToken);
        }

        public static async Task<T> PostJsonWithToken<T>(this HttpClient httpClient,
            string url, object payload, string accessToken = null)
        {
            var content = CreateJsonContent(payload);
            return await SendWithToken<T>(httpClient, url, HttpMethod.Post, accessToken, content);
        }

        public static async Task<T> PostForm<T>(this HttpClient httpClient,
            string url, object payload, string accessToken = null)
        {
            var content = CreateFormContent(payload);
            return await SendWithToken<T>(httpClient, url, HttpMethod.Post, accessToken, content);
        }

        public static async Task<T> DeleteWithToken<T>(this HttpClient httpClient,
            string url, object payload = null, string accessToken = null)
        {
            var content = CreateJsonContent(payload);
            return await SendWithToken<T>(httpClient, url, HttpMethod.Delete, accessToken, content);
        }

        public static async Task<T> SendWithToken<T>(HttpClient httpClient,
            string url, HttpMethod method, string accessToken = null, HttpContent content = null)
        {
            var request = new HttpRequestMessage(method, url);
            if (content != null)
                request.Content = content;
            if (accessToken != null)
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            var response = await httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException();

            return await response.Content.ReadAsAsync<T>();
        }


        private static HttpContent CreateJsonContent(object payloadObject)
        {
            var payload = JsonConvert.SerializeObject(payloadObject);
            return new StringContent(payload, Encoding.UTF8, "application/json");
        }        
        
        private static HttpContent CreateFormContent(object payloadObject)
        {
            var json = JsonConvert.SerializeObject(payloadObject);
            var keyPairs = JsonConvert.DeserializeObject<Dictionary<string, string>>(json);
            return new FormUrlEncodedContent(keyPairs);
        }
    }
}
