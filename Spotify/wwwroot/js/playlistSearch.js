var GlobalAccesssToken = UrlParams.get('access_token');


function Search() {
    const query = $("#searchbar").val();
    if (query.length > 0) {
        const playlistMatches = GlobalPlaylists
            .filter(p => p.songs.items
                .find(s => GetMatch(s.track, query)));
        ShowResults(playlistMatches, query);
        ListenForRemoveClicks();
    }
}

function ShowResults(playlistMatches, query) {
    $("#tableBody").empty();
    $(playlistMatches).each((i, playlist) => {
        const playlistSongs = playlist.songs.items;
        const songs = playlistSongs.filter(s => GetMatch(s.track, query));
        const row = ConstructRow(playlist, songs);
        $("#tableBody").append(row);
    });

    if (playlistMatches.length > 0)
        $("#tablePanel").removeClass("hidden");
}

function ConstructRow(playlist, songs) {
    let artists = "";
    let tracks = "";
    let row = `<tr>
                        <td class="text-center">${playlist.name}</td>`;
    $(songs).each((i, song) => {
        artists += `<p>${song.track.artistsString}</p>`;
        tracks += `<p class="song" playlistId="${playlist.id}" uri="${song.track.uri}">${song.track.name}</p>`;
    });
    row += `    <td>${artists}</td>
                        <td>${tracks}</td>
                    </tr>`;
    return row;
}

function GetMatch(track, query) {
    if ($("#selectedSearchOption").text().includes("Song"))
        return PartialMatch(track.name, query);

    if ($("#selectedSearchOption").text().includes("Artist"))
        return PartialMatch(track.artistsString, query);

    return PartialMatch(track.name, query) || PartialMatch(track.artistsString, query);
}

function PartialMatch(type, query) {
    return type.toLowerCase().includes(query.toLowerCase().trim());
}


function TriggerRemoval(playlistId, songUri) {
    const playlist = GlobalPlaylists.find(p => p.id === playlistId);
    const track = playlist.songs.items.find(s => s.track.uri === songUri).track;
    const confirmed = confirm(`Do you want to remove "${track.name}" by "${track.artistsString}" from "${playlist.name}"?`);
    if (confirmed)
        RemoveFromServer(RemoveSongFromLocal, playlistId, songUri);
}

function RemoveFromServer(callback, playlistId, songUri) {
    $.ajax({
        url: `/api/spotify/playlists/${playlistId}/tracks/${songUri}`,
        type: 'delete',
        headers: {
            'Authorization': `Bearer ${GlobalAccesssToken}`
        },
        beforeSend: function () {
            ShowLoader();
        }
    }).fail(function () {
        alert("Delete exploded");
    }).done(function () {
        callback(playlistId, songUri);
    }).always(function () {
        HideLoader();
    });
}

function RemoveSongFromLocal(playlistId, songUri) {
    const playlistIndex = GlobalPlaylists.findIndex(p => p.id === playlistId);
    _.remove(GlobalPlaylists[playlistIndex].songs.items, s => s.track.uri === songUri);
    Search();
}

function GetNewAuthByRefreshToken(callback) {
    $.ajax({
        url: `/api/spotify/token?refresh_token=${UrlParams.get('refresh_token')}`,
        type: 'get',
        beforeSend: function () {
            ShowLoader();
        }
    }).fail(function () {
        alert("Refresh exploded");
        HideLoader();
    }).done(function (response) {
        callback(response);
    });
}

function UpdateClockAndAccessToken(authResponse) {
    const expiry = CalculateUnixInMsExpiry(authResponse.expires_in);
    ResetClock('clockdiv', new Date(expiry));
    GlobalAccesssToken = authResponse.access_token;
    HideLoader();
}

function UpdatePageWithNewAccess(authResponse) {
    const expiry = CalculateUnixInMsExpiry(authResponse.expires_in);
    UrlParams.set('expiry', expiry);
    UrlParams.set('access_token', authResponse.access_token);
    window.location.search = UrlParams.toString();
}

function ListenForRemoveClicks() {
    $(".song").click(function () {
        const playlistId = $(this).attr("playlistId");
        const songUri = $(this).attr("uri");
        TriggerRemoval(playlistId, songUri);
    });
}

function LoadInitialClock() {
    const sessionExpiry = parseInt(UrlParams.get('expiry'));
    InitializeClock('clockdiv', new Date(sessionExpiry));
}

$(document).ready(function () {
    LoadInitialClock();


    // Listeners
    // ------------------
    $("#searchbar").keyup(() => Search());
    $("#searchOptions li").click((e) => {
        const selectedOption = e.currentTarget.innerText;
        $("#selectedSearchOption").html(`${selectedOption} <span class="caret"></span>`);
        Search();
    });
    $('#refreshDataButton').click(() => GetNewAuthByRefreshToken(UpdatePageWithNewAccess));
    $('#refreshTokenButton').click(() => GetNewAuthByRefreshToken(UpdateClockAndAccessToken));
});
