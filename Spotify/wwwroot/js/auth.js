const GetAccessToken = () => localStorage.getItem("access_token");
const GetRefreshToken = () => localStorage.getItem("refresh_token");
const GetAccessTokenExpiry = () => parseInt(localStorage.getItem("token_expiry"));

function SetupAuthorization(accessToken, refreshToken, tokenExpiry) {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("token_expiry", tokenExpiry);
}

async function EnsureTokenIsFresh() {
    const fiveMinutesInMs = 300000; // safety buffer
    const now = new Date().valueOf();
    const expiryWithBufferSubtracted = GetAccessTokenExpiry() - fiveMinutesInMs;
    const tokenIsAlive = expiryWithBufferSubtracted > now;
    if (!tokenIsAlive)
        await RefreshToken();
}

async function RefreshToken() {
    ShowLoader("Refreshing session...");
    return await fetch(`/api/spotify/token?refreshToken=${GetRefreshToken()}`)
        .then(response => response.json())
        .then(json => {
            HideLoader();
            SetupAuthorization(json.access_token, GetRefreshToken(), CalculateExpiryInUnixMs(json.expires_in));
        })
        .catch((error) => {
            //alert("Refresh exploded");
            window.location.href = "/";
            throw error;
        });
}

function Logout() {
    const url = "https://accounts.spotify.com/en/logout";
    const spotifyLogoutWindow = window.open(url, "Spotify Logout", "width=700,height=500,top=40,left=40");
    setTimeout(() => {
        spotifyLogoutWindow.close();
        localStorage.clear();
        window.location.href = "/";
    }, 2000);
}

$("#logoutButton").click(() => Logout());