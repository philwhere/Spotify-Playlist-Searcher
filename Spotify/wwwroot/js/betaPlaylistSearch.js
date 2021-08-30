var GlobalEventsWebSocket;
var GlobalRecurringPing;

$(document).ready(async function () {
    await ConnectWebSocket();
});


async function ConnectWebSocket() {
    await EnsureTokenIsFresh();
    const url = `wss://dealer.spotify.com?access_token=${GetAccessToken()}`;
    GlobalEventsWebSocket = new WebSocket(url);
    console.log(`Socket connected at ${new Date()}`);
    HandlePlaylistEvents();
    KeepAlive();
}

function HandlePlaylistEvents() {
    GlobalEventsWebSocket.onmessage = async function (messageEvent) {
        const data = JSON.parse(messageEvent.data);
        if (data.uri && data.uri.startsWith("hm://playlist/v2/playlist")) {
            console.log(data);
            const uriParts = data.uri.split("/");
            const playlistId = uriParts[uriParts.length - 1];

            await ProcessPlaylistChange(playlistId);
        }
    }
}

async function ProcessPlaylistChange(playlistId) {
    ShowLoader();
    const requestDate = new Date();
    const playlistExists = await GetPlaylistExistence(playlistId);
    if (playlistExists)
        await UpdateAffectedPlaylist(playlistId);
    else
        RemovePlaylistFromMemory(playlistId);
    GlobalDataLastRequestedDate = requestDate;
    TrackPlaylistsSnapshotStaleness();
    HideLoader();
}

async function GetPlaylistExistence(playlistId) {
    await EnsureTokenIsFresh();

    const requestOptions = { headers: { "Authorization": `Bearer ${GetAccessToken()}` } };
    return await fetch(`/api/spotify/playlists/${playlistId}/exists`, requestOptions)
        .then(response => response.json())
        .catch((error) => {
            HideLoader();
            alert("Existence check exploded");
            throw error;
        });}

async function UpdateAffectedPlaylist(playlistId) {
    await EnsureTokenIsFresh();
    ShowLoader("");

    const uri = `/api/spotify/playlists`;
    const requestOptions =
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GetAccessToken()}`
        },
        body: JSON.stringify([playlistId])
    };

    return await fetch(uri, requestOptions)
        .then(response => response.json())
        .then(json => {
            json.forEach(freshPlaylist => {
                const index = GlobalPlaylists.findIndex(p => p.id === freshPlaylist.id);
                if (index !== -1)
                    GlobalPlaylists[index] = freshPlaylist;
                else
                    GlobalPlaylists[GlobalPlaylists.length] = freshPlaylist;
            });
            Search();
        })
        .catch((error) => {
            HideLoader();
            alert("Data refresh exploded");
            throw error;
        });
}

function KeepAlive() {
    GlobalRecurringPing = setInterval(async function () {
        const readyState = GlobalEventsWebSocket.readyState;
        if (readyState === WebSocket.CLOSED || readyState === WebSocket.CLOSING) {
            console.log(`Socket closed around ${new Date()}`);
            clearInterval(GlobalRecurringPing);
            await ConnectWebSocket();
        }
        if (readyState === WebSocket.OPEN)
            GlobalEventsWebSocket.send(JSON.stringify({ type: "ping" }));
    }, 30000);
}

function RemovePlaylistFromMemory(playlistId) {
    const index = GlobalPlaylists.findIndex(p => p.id === playlistId);
    GlobalPlaylists.splice(index);
    Search();
}