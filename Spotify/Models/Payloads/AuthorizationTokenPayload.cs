namespace Spotify.Models.Payloads
{
    public class AuthorizationTokenPayload
    {
        public string grant_type { get; } = "authorization_code";
        public string code { get; }
        public string redirect_uri { get; }
        public string client_id { get; }
        public string client_secret { get; }

        public AuthorizationTokenPayload(string code, string redirect_uri, string client_id, string client_secret)
        {
            this.code = code;
            this.redirect_uri = redirect_uri;
            this.client_id = client_id;
            this.client_secret = client_secret;
        }
    }
}
