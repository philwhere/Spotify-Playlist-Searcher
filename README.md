# Spotify-Playlist-Searcher

Sometimes I add songs to my playlists that over time I come to loathe.
I have so many playlists now that it would be insane to manually seek and destroy using the Spotify UI.
So I made this. [Enjoy](https://philsps.azurewebsites.net)

## What's in the box
#### Playlist Search
Search by song/artist/album/all and find which playlists you have added those matching tracks to.\
This is achieved by basically taking a snapshot of every playlist you have and pulling it into browser memory.\
With an input of "easy", the desktop design looks pretty much like this
Playlist | Artist | Track
------------ | ------------- | -------------
Beige Red Pink | Mac Ayres | Easy
Cruising | Commodores | Easy


Clicking on a row will prompt you to confirm that you want to remove the track from the playlist.

#### Recently Played
For when you are just enjoying the music then the Spotify radio ticks over and you can't navigate to the previous tracks.\
Clicking on a row will open the Spotify URI for that track. This will deeplink into the Spotify app on any platforms.
>Note: Currently doesn’t support podcast episodes. Returns the most recent 50 tracks played by a user. Note that a track currently playing will not be visible in play history until it has completed. A track must be played for more than 30 seconds to be included in play history.


***

Want to build your own?\
https://developer.spotify.com
