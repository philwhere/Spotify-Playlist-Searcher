var GlobalAccesssToken = UrlParams.get('access_token');


function Search() {
    const query = $('#searchbar').val().trim();
    if (_.isEmpty(query))
        return;
    const playlistMatches = GetPlaylistMatches(query);
    ShowResults(playlistMatches);
    ListenForRemoveClicks();
}

function GetPlaylistMatches(query) {
    function ExcludeNonMatchingSongs(playlist) {
        return Object.assign({}, playlist, {
            songs: Object.assign({}, playlist.songs, {
                items: playlist.songs.items.filter(s => GetMatch(s.track, query))
            })
        });
    }
    return GlobalPlaylists
        .map(playlist => ExcludeNonMatchingSongs(playlist))
        .filter(p => !_.isEmpty(p.songs.items));
}

function ShowResults(playlistMatches) {
    $('#tableBody').empty();
    for (const playlist of playlistMatches) {
        const row = ConstructRow(playlist);
        $('#tableBody').append(row);
    }
    if (playlistMatches.length > 0)
        $('#tablePanel').removeClass('hidden');
}

function ConstructRow(playlist) {
    const songs = playlist.songs.items;
    let row = `<tr><td class="text-center">${playlist.name}</td>`;
    const artists = songs.reduce((prev, song) => `${prev}<p>${song.track.artistsString}</p>`, '');
    const tracks = songs.reduce((prev, song) => `${prev}<p class="song" playlistId="${playlist.id}" uri="${song.track.uri}">${song.track.name}</p>`, '');
    return row += `<td>${artists}</td><td>${tracks}</td></tr>`;
}

function GetMatch(track, query) {
    if ($("#selectedSearchOption").text().includes('Song'))
        return PartialMatch(track.name, query);

    if ($('#selectedSearchOption').text().includes('Artist'))
        return PartialMatch(track.artistsString, query);

    return PartialMatch(track.name, query) || PartialMatch(track.artistsString, query);
}
function PartialMatch(type, query) {
    return type.toLowerCase().includes(query.toLowerCase());
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
    }).always(function () {
        HideLoader();
    }).fail(function () {
        alert('Delete exploded');
    }).done(function () {
        callback(playlistId, songUri);
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
    }).always(function () {
        HideLoader();
    }).fail(function () {
        alert('Refresh exploded');
    }).done(function (response) {
        const expiry = CalculateUnixInMsExpiry(response.expires_in);
        callback(response.access_token, expiry);
    });
}

function UpdateClockAndAccessToken(accessToken, expiry) {
    ResetClock('clockdiv', new Date(expiry));
    GlobalAccesssToken = accessToken;
}

function UpdatePageWithNewAccess(accessToken, expiry) {
    UrlParams.set('access_token', accessToken);
    UrlParams.set('expiry', expiry);
    ShowLoader();
    window.location.search = UrlParams.toString();
}

function ListenForRemoveClicks() {
    $('.song').click(function () {
        const playlistId = $(this).attr('playlistId');
        const songUri = $(this).attr('uri');
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
    $('#searchbar').keyup(() => Search());
    $('#searchOptions li').click((e) => {
        const selectedOption = e.currentTarget.innerText;
        $('#selectedSearchOption').html(`${selectedOption} <span class="caret"></span>`);
        Search();
    });
    $('#refreshDataButton').click(() => GetNewAuthByRefreshToken(UpdatePageWithNewAccess));
    $('#refreshTokenButton').click(() => GetNewAuthByRefreshToken(UpdateClockAndAccessToken));
});
