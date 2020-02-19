var GlobalAccessToken = GlobalUrlParams.get("access_token");
var GlobalAccessTokenExpiry = GlobalUrlParams.get("expiry");
var GlobalUseMobileView;
var GlobalSelectedSearchOption = "All";
var GlobalLastSearchTimestamp;

function Search() {
    const query = $("#searchBar").val().trim();
    if (query.length < 3)
        return;
    const playlistMatches = GetPlaylistMatches(query);
    GlobalUseMobileView ? DisplayMobileResults(playlistMatches) : DisplayDesktopResults(playlistMatches);
    ListenForRemoveClicks();

    if (!_.isEmpty(playlistMatches))
        LoadLibraryForLatestSearch(playlistMatches);
}

function LoadLibraryForLatestSearch(playlistMatches) {
    const now = new Date().toISOString();
    GlobalLastSearchTimestamp = now;
    setTimeout(async () => {
        if (GlobalLastSearchTimestamp === now)
            await LoadLibraryStatus(playlistMatches);
    }, 1000);
}

async function LoadLibraryStatus(playlistMatches) {
    const songs = playlistMatches.flatMap(p => p.songs.items);
    const songUris = songs.map(i => i.track.uri).filter(uri => uri.startsWith("spotify:track")); //do not lookup local songs
    const songIds = _.uniq(songUris.map(uri => uri.replace("spotify:track:", "")));
    if (songIds.length < 30 && !_.isEmpty(songIds))
        await GetLibraryStatus(songIds).then((songLibraryMap) => DisplayLibraryStatus(songLibraryMap));
}

function GetPlaylistMatches(query) {
    function excludeNonMatchingSongs(playlist) {
        return Object.assign({}, playlist, {
            songs: Object.assign({}, playlist.songs, {
                items: playlist.songs.items.filter(s => GetMatch(s.track, query))
            })
        });
    }
    return GlobalPlaylists
        .map(playlist => excludeNonMatchingSongs(playlist))
        .filter(p => !_.isEmpty(p.songs.items));
}

function DisplayDesktopResults(playlistMatches) {
    $("#tableBody").empty();
    const html = playlistMatches.reduce((prev, playlist) => `${prev}${BuildTablePlaylistHtml(playlist)}`, "");
    $("#tableBody").append(html);
    _.isEmpty(playlistMatches)
        ? $("#desktopResultsContainer").addClass("hidden")
        : $("#desktopResultsContainer").removeClass("hidden");
}

function DisplayMobileResults(playlistMatches) {
    $("#mobileResultsContainer").empty();
    const html = playlistMatches.reduce((prev, playlist) => `${prev}${BuildMobilePlaylistHtml(playlist)}`, "");
    $("#mobileResultsContainer").removeClass("hidden").append(html);
}

function BuildMobilePlaylistHtml(playlist) {
    const songs = playlist.songs.items;
    const playlistSection = 
        `<div class="playlist-section">
            <div class="row">
                <div class="col-xs-12 text-left">
                    <h3>${playlist.name}</h3>
                </div>
            </div>
        <hr class="playlist-separator" />`;
    const playlistSongsHtml =
        songs.reduce((prev, song) => `${prev}
            <div class="song song-mobile" playlistId="${playlist.id}" uri="${song.track.uri}">
                <p class="song-name">${song.track.name}</p>
                <p class="artist-name">${song.track.artistsString}</p>
            </div>`, "");
    const songsSection = 
        `<div class="row">
            <div class="col-xs-12 text-left unpad">${playlistSongsHtml}</div>
        </div>`;
    return playlistSection + songsSection + "</div>";
}

function BuildTablePlaylistHtml(playlist) {
    const songs = playlist.songs.items;
    return songs.reduce((prev, song) => `${prev}
        <tr class="song" playlistId="${playlist.id}" uri="${song.track.uri}">
            <td class="text-center">${playlist.name}</td>
            <td>${song.track.artistsString}</td>
            <td>${song.track.name}</td>
        </tr>`, "");

    // Artist grouped view
    //let row = `<tr><td class="text-center">${playlist.name}</td>`;
    //const artists = songs.reduce((prev, song) => `${prev}<p>${song.track.artistsString}</p>`, '');
    //const tracks = songs.reduce((prev, song) => `${prev}<p class="song" playlistId="${playlist.id}" uri="${song.track.uri}">${song.track.name}</p>`, '');
    //return row += `<td>${artists}</td><td>${tracks}</td></tr>`;
}

function GetMatch(track, query) {
    if (!track)
        return false;
    if (GlobalSelectedSearchOption === "Songs")
        return PartialMatch(track.name, query);
    if (GlobalSelectedSearchOption === "Artists")
        return PartialMatch(track.artistsString, query);
    if (GlobalSelectedSearchOption === "Albums")
        return PartialMatch(track.album.name, query);
    return MatchesOnSongArtistOrAlbum(track, query);
}

function PartialMatch(field, query) {
    const words = query.split(" ").filter(w => w !== "");
    const isMatch = words.every(w => Matches(field, w));
    return isMatch;
}

function MatchesOnSongArtistOrAlbum(track, query) {
    const words = query.split(" ").filter(w => w !== "");
    function matchesAnyField(word) {
        return Matches(track.name, word) || Matches(track.artistsString, word) || Matches(track.album.name, word);
    }
    const isMatch = words.every(w => matchesAnyField(w));
    return isMatch;
}

function Matches(field, query) {
    field = NormalizeDiacritics(field);
    return field.toLowerCase().includes(query.toLowerCase());
}

function NormalizeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function TriggerRemoval(playlistId, songUri) {
    const playlist = GlobalPlaylists.find(p => p.id === playlistId);
    const track = playlist.songs.items.find(s => s.track.uri === songUri).track;
    const confirmed = confirm(`Do you want to remove "${track.name}" by "${track.artistsString}" from "${playlist.name}"?`);
    if (confirmed)
        await RemoveFromServer(playlistId, songUri).done(() => RemoveSongFromLocal(playlistId, songUri));
}

async function RemoveFromServer(playlistId, songUri) {
    await EnsureTokenIsFresh();
    const body = { "tracks": [ { "uri": songUri } ] };
    return $.ajax({
        url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        type: "delete",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GlobalAccessToken}`
        },
        data: JSON.stringify(body),
        beforeSend: function() {
            ShowLoader("Removing song from playlist...");
        }
    }).always(function () {
        HideLoader();
    }).fail(function (ex) {
        if (ex.responseJSON.error.message)
            alert(ex.responseJSON.error.message);
        else
            alert("Delete exploded");
    });
}

async function GetLibraryStatus(songIds) {
    await EnsureTokenIsFresh();
    const songIdsJoined = songIds.join(",");
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${GlobalAccessToken}`);
    return await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${songIdsJoined}`, { headers })
        .then(response => response.json())
        .then(jsonResponse => {
            const songLibraryMap = {};
            songIds.forEach((s, i) => songLibraryMap[s] = jsonResponse[i]);
            return songLibraryMap;
        });
}

function DisplayLibraryStatus(songLibraryMap) {
    $(".song").each(function () {
        const isLocal = $(this).attr("uri").startsWith("spotify:local");
        const songId = $(this).attr("uri").replace("spotify:track:", "");
        const isInLibrary = songLibraryMap[songId];
        if (!isInLibrary && !isLocal)
            $(this).addClass("non-library-song");
    });
}

function RemoveSongFromLocal(playlistId, songUri) {
    const playlistIndex = GlobalPlaylists.findIndex(p => p.id === playlistId);
    _.remove(GlobalPlaylists[playlistIndex].songs.items, s => s.track.uri === songUri);
    Search();
}

async function EnsureTokenIsFresh() {
    const fiveMinutesInMs = 300000;
    const offsetNowDate = new Date().valueOf() - fiveMinutesInMs;
    const tokenIsExpired = () => GlobalAccessTokenExpiry < offsetNowDate;
    if (tokenIsExpired())
        await RefreshToken();
}

async function RefreshToken() {
    ShowLoader("Refreshing session...");
    return await fetch(`/api/spotify/token?refreshToken=${GlobalUrlParams.get("refresh_token")}`)
        .then(response => response.json())
        .then(jsonResponse => {
            HideLoader();
            GlobalAccessTokenExpiry = CalculateExpiryInUnixMs(jsonResponse.expires_in);
            GlobalAccessToken = jsonResponse.access_token;
        })
        .catch((error) => { 
            alert("Refresh exploded");
            throw error;
        });
}

function UpdateClockAndAccessToken(accessToken, expiry) {
    ResetClock("clockDiv", new Date(expiry));
    GlobalAccessToken = accessToken;
}

async function RefreshPageWithNewAccess() {
    await EnsureTokenIsFresh();
    GlobalUrlParams.set("access_token", GlobalAccessToken);
    GlobalUrlParams.set("expiry", GlobalAccessTokenExpiry);
    ShowLoader("Refreshing playlists...");
    window.location.search = GlobalUrlParams.toString();
}

function LoadInitialClock() {
    const sessionExpiry = parseInt(GlobalUrlParams.get("expiry"));
    InitializeClock("clockDiv", new Date(sessionExpiry));
}

function SwitchViews() {
    GlobalUseMobileView
        ? $("#mobileResultsContainer").removeClass("hidden")
        : $("#desktopResultsContainer").removeClass("hidden");
    GlobalUseMobileView = !GlobalUseMobileView;
    $("#mobileResultsContainer,#desktopResultsContainer").toggleClass("hidden");
    Search(); //search will display using state
}

function SetViewType() {
    GlobalUseMobileView = $(window).width() < 768;
    GlobalUseMobileView
        ? $("#desktopResultsContainer").addClass("hidden")
        : $("#mobileResultsContainer").addClass("hidden");
    Search();
}

function UpdateSearchOption(option) {
    GlobalSelectedSearchOption = option.trim();
    $("#selectedSearchOption").html(`${option} <span class="caret"></span>`);
    Search();
}

$(document).ready(() => {
    LoadInitialClock();
    SetViewType();

    // Listeners
    // ------------------
    $("#searchBar").keyup(() => Search());
    $("#searchOptions li").click((e) => UpdateSearchOption(e.currentTarget.innerText));
    $("#refreshDataButton").click(async () => await RefreshPageWithNewAccess());
    $("#secretViewSwitch").click(() => SwitchViews());
    $(window).resize(() => SetViewType());
});

function ListenForRemoveClicks() {
    $(".song").click(async function () {
        const playlistId = $(this).attr("playlistId");
        const songUri = $(this).attr("uri");
        await TriggerRemoval(playlistId, songUri);
    });
}