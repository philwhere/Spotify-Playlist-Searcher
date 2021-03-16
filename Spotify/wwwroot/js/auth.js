const LocalStorageKeys = Object.freeze({
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
    TOKEN_EXPIRY: "token_expiry",
    REDIRECT_URL: "redirect_uri"
});

const GetAccessToken = () => localStorage.getItem(LocalStorageKeys.ACCESS_TOKEN);
const GetRefreshToken = () => localStorage.getItem(LocalStorageKeys.REFRESH_TOKEN);
const GetAccessTokenExpiry = () => parseInt(localStorage.getItem(LocalStorageKeys.TOKEN_EXPIRY));


function SetupAuthorization(accessToken, refreshToken, tokenExpiry) {
    localStorage.setItem(LocalStorageKeys.ACCESS_TOKEN, accessToken);
    localStorage.setItem(LocalStorageKeys.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(LocalStorageKeys.TOKEN_EXPIRY, tokenExpiry);
}

async function EnsureTokenIsFresh() {
    if (!GetAccessToken()) {
        AuthorizeClient();
        return;
    }

    const fiveMinutesInMs = 300000; // safety buffer
    const now = new Date().valueOf();
    const expiryWithBufferSubtracted = GetAccessTokenExpiry() - fiveMinutesInMs;
    const tokenIsAlive = expiryWithBufferSubtracted > now;
    if (!tokenIsAlive)
        await RefreshToken();
}

function AuthorizeClient() {
    localStorage.clear();
    const currentUrl = window.location.href;
    localStorage.setItem(LocalStorageKeys.REDIRECT_URL, currentUrl);
    window.location.href = "/"; // This page launches the authorization flow
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
            AuthorizeClient();
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