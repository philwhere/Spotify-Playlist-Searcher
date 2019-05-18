namespace Spotify.Models.Payloads
{
    public class RefreshTokenPayload
    {
        public string grant_type { get; } = "refresh_token";
        public string refresh_token { get; }
        public string client_id { get; }
        public string client_secret { get; }

        public RefreshTokenPayload(string refresh_token, string client_id, string client_secret)
        {
            this.refresh_token = refresh_token;
            this.client_id = client_id;
            this.client_secret = client_secret;
        }
    }
}
