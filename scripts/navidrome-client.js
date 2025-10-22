// Client-side Navidrome API client
class ClientSideND {
  constructor(url, user, pass) {
    this.root = url.replace(/\/$/, "");
    this.user = user;
    this.pass = pass;
    this.base = `${this.root}/rest`;
  }

  _rand(len = 16) {
    const array = new Uint8Array(len);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, len);
  }

  async _req(end, params = {}) {
    const salt = this._rand();
    const token = md5(this.pass + salt);

    const queryParams = new URLSearchParams({
      u: this.user,
      t: token,
      s: salt,
      v: "1.16.1",
      c: "wrapped",
      f: "json",
      ...params,
    });

    try {
      const response = await fetch(`${this.base}/${end}?${queryParams}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data["subsonic-response"]?.status === "ok"
        ? data["subsonic-response"]
        : null;
    } catch (error) {
      console.error("API request failed:", error);
      return null;
    }
  }

  // Format duration helper
  fmtDur(s) {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (s < 3600) return `${m}m`;
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    return d ? `${d}d ${h % 24}h` : `${h}h ${m % 60}m`;
  }

  async stats(progressCallback = () => {}) {
    const albums = [],
      songs = [],
      artistPlays = new Map(),
      artistIdToName = new Map();
    let offset = 0,
      totalPlays = 0,
      totalSec = 0,
      rated = 0,
      ratingSum = 0;
    let oldestDate = Infinity;
    let oldestSong = null;
    let totalBitrate = 0;
    let bitrateCount = 0;
    let totalDuration = 0;
    let numFavorites = 0;
    let artistIds = new Set();
    let artistsListened = new Set();

    // quality tracking
    let totalQuality = 0;
    let qualityCount = 0;
    let totalQualityWeightedByPlays = 0;
    let losslessCount = 0;
    let hiResCount = 0;

    function computeQualityScore(s) {
      const suffix = (s.suffix || "").toLowerCase();
      const ct = (s.contentType || "").toLowerCase();
      const br = s.bitRate || 0; // kbps
      const sr = s.samplingRate || s.sampleRate || 0; // Hz
      const bd = s.bitDepth || 0; // bits

      const losslessSuffixes = ["flac", "alac", "wav", "aiff", "aif", "ape"];
      const lossySuffixes = ["mp3", "aac", "m4a", "ogg", "opus"];

      const isLossless =
        losslessSuffixes.includes(suffix) ||
        ct.includes("flac") ||
        ct.includes("wav") ||
        ct.includes("alac") ||
        ct.includes("aiff");
      const isLossy =
        lossySuffixes.includes(suffix) ||
        ct.includes("mpeg") ||
        ct.includes("mp3") ||
        ct.includes("aac") ||
        ct.includes("ogg") ||
        ct.includes("opus");

      // Lossless scoring (0-100)
      if (isLossless) {
        losslessCount++;
        if (bd >= 24 && sr >= 96000) {
          hiResCount++;
          return 100; // true hi-res
        }
        if (bd >= 24 && sr >= 48000) return 95;
        if (bd >= 16 && sr >= 44100) return 85; // CD quality
        return 75; // other lossless / lower sample/depth
      }

      // Lossy scoring (0-100)
      if (isLossy) {
        // bitRate often in kbps for lossy; map to a 0-100-ish scale
        if (br >= 320) return 75;
        if (br >= 256) return 60;
        if (br >= 192) return 45;
        if (br >= 128) return 30;
        return 15; // low-bitrate lossy
      }

      // Unknown type fallback: try bitrate then sampling/bitdepth
      if (bd >= 24 && sr >= 96000) {
        hiResCount++;
        return 98;
      }
      if (br >= 320) return 70;
      if (br) return Math.min(70, Math.floor((br / 320) * 70));
      return 50; // unknown/neutral
    }

    /* fetch all albums */
    progressCallback(0, "Starting album scan", "albums");
    while (true) {
      const batch =
        (
          await this._req("getAlbumList2", {
            type: "alphabeticalByName",
            size: 500,
            offset,
          })
        )?.albumList2?.album || [];

      if (!batch.length) break;
      albums.push(...batch);
      offset += batch.length;

      progressCallback(
        10 + (albums.length / 5000) * 20,
        `Fetched ${albums.length} albums`,
        "albums"
      );

      // Small delay to prevent overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    progressCallback(30, `Processing ${albums.length} albums`, "albums");

    /* walk albums → songs */
    for (let i = 0; i < albums.length; i++) {
      const alb = (await this._req("getAlbum", { id: albums[i].id }))?.album;
      if (!alb) continue;

      for (const s of alb.song || []) {
        const pc = s.playCount || 0,
          dur = s.duration || 0,
          rat = s.userRating || 0,
          art = s.artist || "",
          artId = s.artistId || "",
          gen = s.genre || alb.genre || "",
          yr = s.year || alb.year || 0;
        totalBitrate += s.bitRate || 0;
        bitrateCount += s.bitRate ? 1 : 0;
        totalDuration += dur;
        numFavorites += s.starred ? 1 : 0;

        // compute quality for this song
        const q = computeQualityScore(s);
        totalQuality += q;
        qualityCount += 1;
        totalQualityWeightedByPlays += q * (pc || 1);

        // oldest song
        if (s.played) {
          const playedMS = new Date(s.played).getTime();
          if (!isNaN(playedMS) && playedMS < oldestDate) {
            oldestDate = playedMS;
            oldestSong = {
              title: s.title || "Unknown",
              artist: art,
              album: alb.name || "",
              playedDate: s.played.slice(0, 10),
            };
          }
        }

        const artistsArr =
          Array.isArray(s.artists) && s.artists.length
            ? s.artists
            : [
                {
                  id: s.artistId || "",
                  name: s.displayArtist || s.artist || "",
                },
              ];
        /* walk artists for this song */
        artistsArr.forEach((ar) => {
          const id = ar.id || ar.name; // fallback to name if id missing
          const name = ar.name || "Unknown";
          if (id) artistIdToName.set(id, name); // keep lookup map filled
          artistIds.add(id);
          if (pc > 0) {
            artistsListened.add(id);
          }

          /* accumulate plays for THIS artist entry */
          if (pc) {
            artistPlays.set(id, (artistPlays.get(id) || 0) + pc);
          }
        });

        /* store song for later functions (top lists, etc.) */
        songs.push({
          title: s.title || "",
          artists: artistsArr,
          duration: dur,
          plays: pc,
          rating: rat,
          genre: gen,
          year: yr,
          album: alb.name || "",
          albumId: alb.id,
          qualityScore: Math.round(q),
        });

        if (pc) {
          totalPlays += pc;
          totalSec += dur * pc;
        }

        if (rat) {
          rated++;
          ratingSum += rat;
        }
      }
      // Update progress every 50 albums
      if (i % 50 === 0) {
        progressCallback(
          30 + (i / albums.length) * 60,
          `Album ${i}/${albums.length}`,
          "albums"
        );
      }

      // Small delay to prevent overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const avgBitrate = totalBitrate / bitrateCount || 0;
    const avgQuality = qualityCount ? totalQuality / qualityCount : 0;
    const avgQualityByPlays =
      totalPlays > 0 ? totalQualityWeightedByPlays / totalPlays : avgQuality;
    const percentLossless = qualityCount
      ? (losslessCount / qualityCount) * 100
      : 0;
    const percentHiRes = qualityCount ? (hiResCount / qualityCount) * 100 : 0;

    progressCallback(90, "Building final objects", "wrap");

    /* top lists */
    const topArtists = [...artistPlays.entries()]
      .sort((a, b) => b[1] - a[1])
      .filter(
        ([k]) =>
          (artistIdToName.get(k) || k).toLowerCase() !== "various artists"
      )
      .slice(0, 10)
      .map(([k, v]) => [artistIdToName.get(k) || k, v]);

    const topSongs = songs
      .filter((x) => x.plays)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10)
      .map((s) => ({ title: s.title, artists: s.artists, plays: s.plays }));

    const topAlbums = albums
      .filter((a) => a.playCount)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10)
      .map((a) => ({
        name: a.name,
        artists: a.artists || "Unknown",
        playCount: a.playCount,
        id: a.id,
      }));
    const topRated = songs
      .filter((s) => s.rating)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map((s) => [s.rating, s.title, s.artist]);

    /* ----------  genre / decade / deep-dive data  ---------- */
    const genreSongCounts = {},
      genrePlayCounts = {},
      decadeSongCounts = {},
      decadePlayCounts = {};
    const artistSongMap = new Map();
    const artistAlbumSet = new Map();

    songs.forEach((s) => {
      // songs & plays per genre
      if (s.genre) {
        genreSongCounts[s.genre] = (genreSongCounts[s.genre] || 0) + 1;
        genrePlayCounts[s.genre] =
          (genrePlayCounts[s.genre] || 0) + (s.plays || 0);
      }

      // songs & plays per decade
      const dec = s.year ? `${Math.floor(s.year / 10) * 10}s` : "Unknown";
      decadeSongCounts[dec] = (decadeSongCounts[dec] || 0) + 1;
      decadePlayCounts[dec] = (decadePlayCounts[dec] || 0) + (s.plays || 0);

      // collect songs / albums per artist for deep-dive
      const key = s.artistId || s.artist;
      if (!artistSongMap.has(key)) artistSongMap.set(key, []);
      artistSongMap.get(key).push(s);

      if (!artistAlbumSet.has(key)) artistAlbumSet.set(key, new Set());
      if (s.albumId) artistAlbumSet.get(key).add(s.albumId);
    });

    // top lists
    const topGenresByPlays = Object.entries(genrePlayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topDecadesByPlays = Object.entries(decadePlayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // artist deep-dive
    const deepArtists = [];
    for (let i = 0; i < Math.min(3, topArtists.length); i++) {
      const [name, plays] = topArtists[i];
      const key = artistIdToName.get(name) || name;
      const artistSongs = artistSongMap.get(key) || [];
      const albums = artistAlbumSet.get(key) || new Set();
      const dur = artistSongs.reduce((a, s) => a + (s.duration || 0), 0);
      const listeningTime = artistSongs.reduce(
        (a, s) => a + (s.duration || 0) * (s.plays || 0),
        0
      );
      const ratings = artistSongs.filter((s) => s.rating).map((s) => s.rating);
      const avgRating = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
      deepArtists.push({
        name,
        totalPlays: plays,
        totalSongs: artistSongs.length,
        albumCount: albums.size,
        totalDuration: dur,
        listeningTime,
        averageRating: avgRating,
        topSongs: artistSongs
          .sort((a, b) => (b.plays || 0) - (a.plays || 0))
          .slice(0, 3)
          .map((s) => [s.title, s.plays || 0]),
      });
    }

    // diversity
    const diversity = artistIds.size
      ? (artistsListened.size / artistIds.size) * 100
      : 0;

    // rating distribution
    const dist = {
      "5_star": 0,
      "4_star": 0,
      "3_star": 0,
      "2_star": 0,
      "1_star": 0,
      unrated: 0,
    };
    songs.forEach((s) => {
      if (!s.rating) dist.unrated++;
      else if (s.rating >= 4.5) dist["5_star"]++;
      else if (s.rating >= 3.5) dist["4_star"]++;
      else if (s.rating >= 2.5) dist["3_star"]++;
      else if (s.rating >= 1.5) dist["2_star"]++;
      else dist["1_star"]++;
    });

    progressCallback(100, "Done", "complete");

    const result = {
      username: this.user,
      totalSongs: songs.length,
      totalAlbums: albums.length,
      totalArtists: artistIds.size,
      totalDuration: totalDuration,
      listeningTime: totalSec,
      topArtistsByPlays: topArtists,
      topSongsByPlaycount: topSongs,
      topAlbumsByPlaycount: topAlbums,
      topRatedSongs: topRated,
      albumBasedStats: {
        totalPlays,
        totalRatings: rated,
        averageRating: rated ? ratingSum / rated : 0,
        listeningTimeBreakdown: { formatted: this.fmtDur(totalSec) },
        trueArtistDiversity: {
          listened: artistsListened.size,
          total: artistIds.size,
          percentage: diversity,
        },
        topGenresBySongs: Object.entries(genreSongCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        topGenresByPlays,
        topDecadesBySongs: Object.entries(decadeSongCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        topDecadesByPlays,
      },
      ratingDistribution: dist,
      genreBreakdown: genreSongCounts,
      decadeBreakdown: decadeSongCounts,
      diversityScore:
        (1 -
          [...artistPlays.values()].reduce(
            (a, p) => a + (p / totalPlays) ** 2,
            0
          )) *
        100,
      deepArtists,
      neglectedTrack: oldestSong,
      qualityScore: Math.round(avgQuality),
      qualityScoreByPlays: Math.round(avgQualityByPlays),
      percentLossless: Math.round(percentLossless * 10) / 10,
      percentHiRes: Math.round(percentHiRes * 10) / 10,
      avgBitrate: Math.round(avgBitrate),
      numFavorites,
      generatedAt: new Date().toLocaleDateString(),
    };
    console.log("Final stats object:", JSON.parse(JSON.stringify(result)));
    return result;
  }
}
