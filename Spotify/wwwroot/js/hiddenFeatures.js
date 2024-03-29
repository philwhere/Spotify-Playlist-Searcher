﻿
// One page is 50 items
async function GetTracksFromLibrary(numberOfPages) {
    const pageSize = 50;
    const numberOfTracksToCheck = numberOfPages * pageSize;
    ShowLoader(`Checking ${numberOfTracksToCheck} most recent songs from library...`);

    let items = [];
    for (let page = 1; page <= numberOfPages; page++) {
        const pageResults = await FetchLibraryItems(page);
        for (const pageItem of pageResults.items)
            pageItem.page = page;
        items = items.concat(pageResults.items);
    }
    return items;
}

async function FetchLibraryItems(page) {
    await EnsureTokenIsFresh();
    const options = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${GetAccessToken()}`
        }
    };
    const offset = (page - 1) * 50;
    return await fetch(`https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`, options)
        .then(response => {
            if (response.status !== 200)
                return response.json().then(json => {
                    alert(`Get exploded: ${json.error.message}`);
                    throw Error(json.error.message);
                });
            return response.json();
        });
}

function IsNotInAPlaylist(uri) {
    const playlistUris = GlobalPlaylists
        .filter(p => p.name !== 'My Shazam Tracks' && p.name !== 'Liked from Radio')
        .flatMap(p => p.songs.items).map(i => i.track.uri);
    return !playlistUris.some(u => u === uri);
}

async function CheckForUnplaylistedSongs(numberOfPages) {
    const pagesOfItems = await GetTracksFromLibrary(numberOfPages);
    const itemsNotInAPlaylist = pagesOfItems
        .filter(i => IsNotInAPlaylist(i.track.uri))
        .map(i => ({
            page: i.page,
            artists: i.track.artists.map(a => a.name).join(", "),
            title: i.track.name
        }));
    console.log(itemsNotInAPlaylist);
    HideLoader();
}