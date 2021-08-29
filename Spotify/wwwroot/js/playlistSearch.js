var GlobalUseMobileView;
var GlobalSelectedSearchOption = "All";
var GlobalLastSearchTimestamp;
var GlobalPlaylists;
var GlobalDataLastRequestedDate;
var GlobalSelectedFilteredPlaylistsIds = [];

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
    field = NormalizeDiacritics(field).toLowerCase();
    query = query.toLowerCase();
    return field.includes(query) || RemoveApostrophesAndQuotes(field).includes(query);
}

function RemoveApostrophesAndQuotes(str) {
    return str.replaceAll("'", "").replaceAll("’", "");
};

function NormalizeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function TriggerRemoval(playlistId, songUri) {
    const playlist = GlobalPlaylists.find(p => p.id === playlistId);
    const track = playlist.songs.items.find(s => s.track.uri === songUri).track;
    const confirmed = confirm(`Do you want to remove "${track.name}" by "${track.artistsString}" from "${playlist.name}"?`);
    if (confirmed)
        await RemoveFromServer(playlistId, songUri).then(() => RemoveSongFromLocal(playlistId, songUri));
}

async function RemoveFromServer(playlistId, songUri) {
    await EnsureTokenIsFresh();
    const body = { "tracks": [{ "uri": songUri }] };
    const options = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GetAccessToken()}`
        },
        body: JSON.stringify(body)
    };
    ShowLoader("Removing song from playlist...");
    return await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, options)
        .then(response => {
            HideLoader();
            if (response.status !== 200)
                return response.json().then(json => {
                    alert(`Delete exploded: ${json.error.message}`);
                    throw Error(json.error.message);
                });
            return response.json();
        });
}

async function GetLibraryStatus(songIds) {
    await EnsureTokenIsFresh();
    const songIdsJoined = songIds.join(",");
    const requestOptions = { headers: { "Authorization": `Bearer ${GetAccessToken()}` } };
    return await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${songIdsJoined}`, requestOptions)
        .then(response => {
            if (response.status !== 200)
                return response.json().then(json => {
                    alert(`${json.error.message}`);
                    throw Error(json.error.message);
                });
            return response.json();
        })
        .then(json => {
            const songLibraryMap = {};
            songIds.forEach((s, i) => songLibraryMap[s] = json[i]);
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

async function UpdatePlaylistsSnapshot() {
    await EnsureTokenIsFresh();
    ShowLoader("Getting playlists...");
    const requestDate = new Date();
    let uri = `/api/spotify/playlists`;
    const debugCacheKey = GlobalUrlParams.get("debugCacheKey");
    uri += debugCacheKey ? `?debugCacheKey=${debugCacheKey}` : "";

    const requestOptions = { headers: { "Authorization": `Bearer ${GetAccessToken()}` } };
    return await fetch(uri, requestOptions)
        .then(response => response.json())
        .then(json => {
            GlobalDataLastRequestedDate = requestDate;
            GlobalPlaylists = json;
            HideLoader();
            Search();
        })
        .catch((error) => {
            HideLoader();
            alert("Data refresh exploded");
            throw error;
        });
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

function TrackPlaylistsSnapshotStaleness() {
    const elapsedSeconds = (new Date() - GlobalDataLastRequestedDate) / 1000;
    const elapsedTimeMessage = `Refreshed ${PrettyPrintElapsedTime(elapsedSeconds)} ago`;
    $("#lastRefresh").text(elapsedTimeMessage);
    setTimeout(TrackPlaylistsSnapshotStaleness, 1000);
}

function ShowPlaylistFilterModal() {
    PopulateModalPlaylists();
    $('#playlistsFilterModal').modal();
};

function PopulateModalPlaylists() {
    const playlists = GlobalPlaylists.map(p => {
        const isSelected = GlobalSelectedFilteredPlaylistsIds.includes(p.id);
        return {
            id: p.id,
            name: p.name,
            uri: p.uri,
            isSelected
        };
    });
    const html = playlists.reduce((prev, playlist) => `${prev}
        <div class="playlist-filter-row${playlist.isSelected ? " playlist-filter-row-selected" : ""}" playlistId="${playlist.id}" uri="${playlist.uri}">
            <div class="text-center">${playlist.name}</div>
        </div>`, "");

    $("#playlistsFilterModal .modal-body").first().html(html);
    ListenForFilterClicks();
    ListenForFilterChanges();
}

function ClearFilterSelection() {
    $(".playlist-filter-row-selected").removeClass("playlist-filter-row-selected");
}

function SelectAllInFilter() {
    $(".playlist-filter-row").addClass("playlist-filter-row-selected");
}

function SaveFilterSelection() {
    const selected = [];
    $(".playlist-filter-row-selected").each(function () {
        const playlistId = $(this).attr("playlistId");
        selected.push(playlistId);
    });
    GlobalSelectedFilteredPlaylistsIds = selected;
}

async function RefreshSome() {
    if (GlobalSelectedFilteredPlaylistsIds.length === 0) {
        ShowPlaylistFilterModal();
    } else {
        await UpdateSelectedPlaylistsSnapshots();
    }
}

async function UpdateSelectedPlaylistsSnapshots() {
    await EnsureTokenIsFresh();
    ShowLoader("Getting playlists...");
    const requestDate = new Date();
    const uri = `/api/spotify/playlists`;
    const requestOptions =
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GetAccessToken()}`
        },
        body: JSON.stringify(GlobalSelectedFilteredPlaylistsIds)
    };

    return await fetch(uri, requestOptions)
        .then(response => response.json())
        .then(json => {
            GlobalDataLastRequestedDate = requestDate;
            json.forEach(freshPlaylist => {
                const index = GlobalPlaylists.findIndex(p => p.id === freshPlaylist.id);
                GlobalPlaylists[index] = freshPlaylist;
            });
            HideLoader();
            Search();
        })
        .catch((error) => {
            alert("Data refresh exploded");
            throw error;
        });
}

$(document).ready(async () => {
    SetViewType();
    await UpdatePlaylistsSnapshot();
    TrackPlaylistsSnapshotStaleness();

    // Listeners
    // ------------------
    $("#searchBar").keyup(() => Search());
    $("#searchOptions li").click((e) => UpdateSearchOption(e.currentTarget.innerText));
    $("#refreshDataButton").click(async () => await UpdatePlaylistsSnapshot());
    $("#secretViewSwitch").click(() => SwitchViews());
    $("#advancedRefreshToggle").click(() => $("#advancedRefreshRow").slideToggle());
    $("#chosePlaylistsFilterButton").click(() => ShowPlaylistFilterModal());
    $("#clearFilterSelectionButton").click(() => ClearFilterSelection());
    $("#selectAllSelectionButton").click(() => SelectAllInFilter());
    $("#refreshSomeButton").click(async () => await RefreshSome());

    $(window).resize(() => SetViewType());
});

function ListenForRemoveClicks() {
    $(".song").click(async function () {
        const playlistId = $(this).attr("playlistId");
        const songUri = $(this).attr("uri");
        await TriggerRemoval(playlistId, songUri);
    });
}

function ListenForFilterChanges() {
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === "attributes" && mutation.attributeName === "class") {
                SaveFilterSelection();
                ToggleClearButton();
            }
        });
    });
    $(".playlist-filter-row").each(function() {
        observer.observe(this, { attributes: true });
    });
}

function ToggleClearButton() {
    if ($(".playlist-filter-row-selected").length > 0 && $("#clearFilterSelectionButton").hasClass("hidden")) {
        $("#clearFilterSelectionButton,#selectAllSelectionButton").toggleClass("hidden");
    }
    if ($(".playlist-filter-row-selected").length === 0 && !$("#clearFilterSelectionButton").hasClass("hidden")) {
        $("#clearFilterSelectionButton,#selectAllSelectionButton").toggleClass("hidden");
    }
}

function ListenForFilterClicks() {
    $(".playlist-filter-row").click(function () {
        $(this).toggleClass("playlist-filter-row-selected");
    });
}