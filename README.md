# Navidrome Playlist Generator

Generate playlists from a CSV file using Navidrome's database.

## Usage

Modify the `docker-compose.yml` file with the directories containing your Navidrome database, csvs, and root music directory then bring the container up, `docker-compose up -d`.

## CSV Files

Each CSV file will be a playlist and the CSV needs to have two columns, title and artist, which will be used to find the song in Navidrome's database.
