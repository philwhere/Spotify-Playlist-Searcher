function Search() {
    var query = $("#searchbar").val();
    if (query.length > 0) {
        var playlistMatches = Playlists
            .filter(p => p.songs.items
                .find(s => GetMatch(s.track, query)));
        ShowResults(playlistMatches, query);
        ListenForRemoveClicks();
    }
}

function ShowResults(playlistMatches, query) {
    $("#tableBody").empty();
    $(playlistMatches).each((i, playlist) => {
        var playlistSongs = playlist.songs.items;
        var songs = playlistSongs.filter(s => GetMatch(s.track, query));
        var row = ConstructRow(playlist, songs);
        $("#tableBody").append(row);
    });

    if (playlistMatches.length > 0)
        $("#tablePanel").removeClass("hidden");
}

function ConstructRow(playlist, songs) {
    var artists = "";
    var tracks = "";
    var row = `<tr>
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


$("#searchbar").keyup(() => Search());

$("#searchOptions li").click((e) => {
    var selectedOption = e.currentTarget.innerText;
    $("#selectedSearchOption").html(`${selectedOption} <span class="caret"></span>`);
    Search();
});

function ListenForRemoveClicks() {
    $(".song").click(function () {
        var playlistId = $(this).attr("playlistId");
        var songUri = $(this).attr("uri");
        TriggerRemoval(playlistId, songUri);
    });
}

function TriggerRemoval(playlistId, songUri) {
    var playlist = Playlists.find(p => p.id === playlistId);
    var track = playlist.songs.items.find(s => s.track.uri === songUri).track;
    var confirmed = confirm(`Do you want to remove track "${track.name}" by "${track.artistsString}" from playlist "${playlist.name}"?`);
    if (confirmed)
        RemoveFromServer(RemoveSongFromLocal, playlistId, songUri);
}

function RemoveFromServer(callback, playlistId, songUri) {
    $.ajax({
        url: `/api/spotify/playlists/${playlistId}/tracks/${songUri}`,
        type: 'delete',
        headers: {
            'Authorization': `Bearer ${urlParams.get('access_token')}`
        },
        beforeSend: function () {
            ShowLoader();
        }
    }).done(function () {
        callback(playlistId, songUri);
    }).always(function () {
        HideLoader();
    });
}

function RemoveSongFromLocal(playlistId, songUri) {
    var playlistIndex = Playlists.findIndex(p => p.id === playlistId);
    _.remove(Playlists[playlistIndex].songs.items, s => s.track.uri === songUri);
    Search();
}

