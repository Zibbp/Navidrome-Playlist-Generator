import sqlite3 from "sqlite3";
import { open } from "sqlite";
import glob from "glob";
import csv from "csvtojson";
import * as fs from "fs";

const db = await createDbConnection("/navidrome/navidrome.db");

let csvs = [];
let csvPlaylists = {};

async function findTrack(title, artist) {
  try {
    let sql = `SELECT * FROM media_file WHERE title = "${title}" AND artist = "${artist}" LIMIT 1`;
    const result = await db.get(sql);
    return result;
  } catch (error) {
    console.log("SQL query error", error);
  }
}

async function gatherCsvs() {
  const files = glob.sync("/csvs/*_deezer.csv");
  csvs = files;
}

async function parseCsvs() {
  for await (const csvFile of csvs) {
    const array = await csv().fromFile(csvFile);
    csvPlaylists[
      `${csvFile.replace("_deezer.csv", "").replace("/csvs/", "")}`
    ] = array;
  }
}

async function findOrCreatePlaylist(name) {
  const path = `/music/playlists/${name}.m3u`;
  try {
    if (fs.existsSync(path)) {
      // Playlists exists
    } else {
      fs.writeFileSync(path, "#EXTM3U\r\n");
    }
  } catch (error) {
    console.log("Error creating or checking playlist", error);
  }
}

async function findSongs() {
  // Get CSV names again to select playlist array
  for await (const csvFile of csvs) {
    const csvName = csvFile.replace("_deezer.csv", "").replace("/csvs/", "");
    // Check if playlist m3u exists
    await findOrCreatePlaylist(csvName);
    // const playlistM3u = fs.openSync(`/music/playlists/${csvName}.m3u`, "a+");
    const playlistM3u = fs.readFileSync(`/music/playlists/${csvName}.m3u`);

    // Loop tracks
    for await (const track of csvPlaylists[`${csvName}`]) {
      // Attempt to find track in Navidrome database
      const dbTrack = await findTrack(track.title, track.artist);
      if (dbTrack) {
        // Track found
        if (playlistM3u.includes(dbTrack.path)) {
          // do nothing, m3u contains track
        } else {
          // add track to playlist
          fs.appendFileSync(
            `/music/playlists/${csvName}.m3u`,
            `${dbTrack.path}\r\n`
          );
          console.log(`Added ${dbTrack.title} to ${csvName} playlist.`);
        }
      } else {
        console.log(
          `Failed to find track "${track.title}" from csv "${csvName}".`
        );
      }
    }
  }
}

async function process() {
  await gatherCsvs();
  await parseCsvs();
  await findSongs();
  db.close();
}

function createDbConnection(filename) {
  return open({
    filename,
    driver: sqlite3.Database,
  });
}

process();
