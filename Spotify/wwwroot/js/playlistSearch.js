var GlobalAccesssToken = GlobalUrlParams.get('access_token');
var GlobalUseNewView = true;

function Search() {
    const query = $('#searchbar').val().trim();
    if (query.length < 2)
        return;
    const playlistMatches = GetPlaylistMatches(query);
    GlobalUseNewView ? ShowNewLayout(playlistMatches) : ShowTableLayout(playlistMatches);
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

function ShowTableLayout(playlistMatches) {
    $('#tableBody').empty();
    var html = playlistMatches.reduce((prev, playlist) => `${prev}${BuildTablePlaylistHtml(playlist)}`, '');
    $('#tableBody').append(html);
}

function ShowNewLayout(playlistMatches) {
    $('#resultsContainer').empty();
    var html = playlistMatches.reduce((prev, playlist) => `${prev}${BuildNewPlaylistHtml(playlist)}`, '');
    $('#resultsContainer').append(html);
}

function BuildNewPlaylistHtml(playlist) {
    const songs = playlist.songs.items;
    let playlistSection = `<div class="row playlist-section"><div class="col-xs-12 text-left"><h3>${playlist.name}</h3></div></div><hr class="playlist-separator" />`;
    let playlistSongsHtml = songs.reduce((prev, song) => `${prev}<div class="song" playlistId="${playlist.id}" uri="${song.track.uri}"><p class="song-name">${song.track.name}</p><p class="artist-name">${song.track.artistsString}</p></div>`, '');
    let songsSection = `<div class="row"><div class="col-xs-12 text-left">${playlistSongsHtml}</div></div>`;
    return playlistSection += songsSection;
}

function BuildTablePlaylistHtml(playlist) {
    const songs = playlist.songs.items;
    let row = `<tr><td class="text-center">${playlist.name}</td>`;
    const artists = songs.reduce((prev, song) => `${prev}<p>${song.track.artistsString}</p>`, '');
    const tracks = songs.reduce((prev, song) => `${prev}<p class="song" playlistId="${playlist.id}" uri="${song.track.uri}">${song.track.name}</p>`, '');
    return row += `<td>${artists}</td><td>${tracks}</td></tr>`;
}

function GetMatch(track, query) {
    if (!track)
        return false;

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
        url: `/api/spotify/token?refresh_token=${GlobalUrlParams.get('refresh_token')}`,
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
    GlobalUrlParams.set('access_token', accessToken);
    GlobalUrlParams.set('expiry', expiry);
    ShowLoader();
    window.location.search = GlobalUrlParams.toString();
}

function ListenForRemoveClicks() {
    $('.song').click(function () {
        const playlistId = $(this).attr('playlistId');
        const songUri = $(this).attr('uri');
        TriggerRemoval(playlistId, songUri);
    });
}

function LoadInitialClock() {
    const sessionExpiry = parseInt(GlobalUrlParams.get('expiry'));
    InitializeClock('clockdiv', new Date(sessionExpiry));
}

function SwitchViews() {
    $('#resultsContainer,#tablePanel').toggleClass('hidden');
    GlobalUseNewView = !GlobalUseNewView;
    Search();
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
    $('#secretViewSwitch').click(() => SwitchViews());
});
