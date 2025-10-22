// Demo data generator
window.createDemoData = function () {
  const totalSongs = 1100;
  const totalAlbums = 85;
  const totalArtists = 240;
  const totalPlays = 2850;
  const totalRated = 485;
  const totalSeconds = 12 * 86400 + 6 * 3600 + 21 * 60; // 12 d 6 h 21 m
  const avgRating = 3.8;
  const diversity = 72.5;
  const listenedArt = 187;

  /* ----------  helpers  ---------- */
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);

  /* ----------  top lists (kept visually the same)  ---------- */
  const topArtists = [
    ["Radiohead", 342],
    ["Daft Punk", 287],
    ["Kendrick Lamar", 265],
    ["Tame Impala", 243],
    ["The Beatles", 221],
    ["Taylor Swift", 198],
    ["Pink Floyd", 187],
    ["Billie Eilish", 176],
    ["Arctic Monkeys", 165],
    ["David Bowie", 154],
  ];
  /* ----------  top songs  ---------- */
  const topSongs = [
    { title: "Bohemian Rhapsody", artists: [{ name: "Queen" }], plays: 45 },
    { title: "Blinding Lights", artists: [{ name: "The Weeknd" }], plays: 42 },
    {
      title: "Stairway to Heaven",
      artists: [{ name: "Led Zeppelin" }],
      plays: 38,
    },
    { title: "Bad Guy", artists: [{ name: "Billie Eilish" }], plays: 36 },
    {
      title: "Smells Like Teen Spirit",
      artists: [{ name: "Nirvana" }],
      plays: 34,
    },
    { title: "Shape of You", artists: [{ name: "Ed Sheeran" }], plays: 32 },
    { title: "Billie Jean", artists: [{ name: "Michael Jackson" }], plays: 30 },
    { title: "Rolling in the Deep", artists: [{ name: "Adele" }], plays: 29 },
    { title: "Hotel California", artists: [{ name: "Eagles" }], plays: 28 },
    {
      title: "Uptown Funk",
      artists: [{ name: "Mark Ronson ft. Bruno Mars" }],
      plays: 27,
    },
  ];
  /* ----------  top albums  ---------- */
  const topAlbums = [
    {
      name: "Dark Side of the Moon",
      artists: [{ name: "Pink Floyd" }],
      playCount: 156,
      id: "demo1",
    },
    {
      name: "Thriller",
      artists: [{ name: "Michael Jackson" }],
      playCount: 143,
      id: "demo2",
    },
    {
      name: "Abbey Road",
      artists: [{ name: "The Beatles" }],
      playCount: 132,
      id: "demo3",
    },
    {
      name: "Random Access Memories",
      artists: [{ name: "Daft Punk" }],
      playCount: 128,
      id: "demo4",
    },
    {
      name: "To Pimp a Butterfly",
      artists: [{ name: "Kendrick Lamar" }],
      playCount: 121,
      id: "demo5",
    },
    {
      name: "1989",
      artists: [{ name: "Taylor Swift" }],
      playCount: 118,
      id: "demo6",
    },
    {
      name: "OK Computer",
      artists: [{ name: "Radiohead" }],
      playCount: 115,
      id: "demo7",
    },
    {
      name: "Currents",
      artists: [{ name: "Tame Impala" }],
      playCount: 109,
      id: "demo8",
    },
    {
      name: "The Rise and Fall of Ziggy Stardust",
      artists: [{ name: "David Bowie" }],
      playCount: 104,
      id: "demo9",
    },
    {
      name: "AM",
      artists: [{ name: "Arctic Monkeys" }],
      playCount: 98,
      id: "demo10",
    },
  ];
  const topRated = [
    [5, "Bohemian Rhapsody", "Queen"],
    [5, "Stairway to Heaven", "Led Zeppelin"],
    [5, "Hotel California", "Eagles"],
    [4.8, "Blinding Lights", "The Weeknd"],
    [4.7, "Bad Guy", "Billie Eilish"],
  ];

  /* ----------  genre & decade breakdowns (sum to 100 %)  ---------- */
  const genrePlaysRel = [28, 22, 15, 12, 8, 5, 4, 3, 2, 1]; // must add to 100
  const genres = [
    "Rock",
    "Pop",
    "Electronic",
    "Hip-Hop",
    "Jazz",
    "Classical",
    "Folk",
    "R&B",
    "Metal",
    "Indie",
  ];
  const topGenresByPlays = genres.map((g, i) => [
    g,
    Math.round((genrePlaysRel[i] / 100) * totalPlays),
  ]);
  const genreBreakdown = Object.fromEntries(
    topGenresByPlays.map(([g, p]) => [g, Math.round(p / rand(3, 6))])
  ); // songs per genre

  const decadePlaysRel = [5, 10, 15, 20, 25, 20, 5]; // must add to 100
  const decades = [
    "1960s",
    "1970s",
    "1980s",
    "1990s",
    "2000s",
    "2010s",
    "2020s",
  ];
  const topDecadesByPlays = decades.map((d, i) => [
    d,
    Math.round((decadePlaysRel[i] / 100) * totalPlays),
  ]);
  const decadeBreakdown = Object.fromEntries(
    topDecadesByPlays.map(([d, p]) => [d, Math.round(p / rand(4, 8))])
  ); // songs per decade

  /* ----------  rating distribution (sums to totalSongs)  ---------- */
  const unratedCount = totalSongs - totalRated;
  /* distribute totalRated into 5 buckets that sum exactly */
  const star5 = Math.max(0, Math.round(totalRated * 0.28));
  const star4 = Math.max(0, Math.round(totalRated * 0.25));
  const star3 = Math.max(0, Math.round(totalRated * 0.22));
  const star2 = Math.max(0, Math.round(totalRated * 0.15));
  let star1 = totalRated - (star5 + star4 + star3 + star2);
  if (star1 < 0) {
    star1 = 0;
  } // safety
  const ratingDistribution = {
    "5_star": star5,
    "4_star": star4,
    "3_star": star3,
    "2_star": star2,
    "1_star": star1,
    unrated: unratedCount,
  };

  /* ----------  deep-artist section (uses exact play counts)  ---------- */
  const deepArtists = topArtists.slice(0, 3).map(([name, plays]) => ({
    name,
    totalPlays: plays,
    totalSongs: rand(20, 40),
    albumCount: rand(4, 10),
    totalDuration: rand(6000, 9000),
    listeningTime: plays * rand(210, 250),
    averageRating: (3.5 + Math.random()).toFixed(1),
    // NEW: look at the artists array
    topSongs: topSongs
      .filter(
        (s) =>
          s.artists.some((a) => a.name === name) ||
          name.includes(s.artists[0]?.name.split(" ")[0])
      )
      .slice(0, 3)
      .map((s) => [s.title, s.plays]),
  }));

  /* ----------  diversity object  ---------- */
  const trueArtistDiversity = {
    listened: listenedArt,
    total: totalArtists,
    percentage: pct(listenedArt, totalArtists),
  };

  /* ----------  quality metrics (NEW – internally consistent)  ---------- */
  const losslessCount = Math.round(totalSongs * 0.42); // 42 % of library
  const hiResCount = Math.round(losslessCount * 0.12); // 12 % of lossless
  const avgBitrate = 812; // kbps
  const qualityScore = 74; // 0-100 library average
  const qualityScoreByPlays = 78; // play-weighted
  const percentLossless = pct(losslessCount, totalSongs);
  const percentHiRes = pct(hiResCount, totalSongs);
  const numFavorites = Math.round(totalSongs * 0.08); // 8 % of library
  /* ----------  "most neglected" track (NEW)  ---------- */
  const neglectedTrack = {
    title: "Yellow Submarine",
    artist: "The Beatles",
    album: "Revolver",
    playedDate: "2023-08-14", // 14 Aug 2023
  };

  /* ----------  final object  ---------- */
  return {
    username: "Demo User",
    totalSongs,
    totalAlbums,
    totalArtists,
    totalDuration: totalSeconds,
    listeningTime: totalSeconds,
    topArtistsByPlays: topArtists,
    topSongsByPlaycount: topSongs,
    topAlbumsByPlaycount: topAlbums,
    topRatedSongs: topRated,
    albumBasedStats: {
      totalPlays,
      totalRatings: totalRated,
      averageRating: parseFloat(
        (
          Object.entries(ratingDistribution).reduce((s, [k, v]) => {
            const stars = {
              "5_star": 5,
              "4_star": 4,
              "3_star": 3,
              "2_star": 2,
              "1_star": 1,
            }[k];
            return s + (stars || 0) * v;
          }, 0) / totalRated
        ).toFixed(2)
      ),
      listeningTimeBreakdown: { formatted: "12 days, 6 hours" },
      trueArtistDiversity,
      topGenresBySongs: Object.entries(genreBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topGenresByPlays: topGenresByPlays,
      topDecadesBySongs: Object.entries(decadeBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topDecadesByPlays: topDecadesByPlays,
    },
    ratingDistribution,
    genreBreakdown,
    decadeBreakdown,
    diversityScore: diversity,
    deepArtists,
    neglectedTrack,
    qualityScore,
    qualityScoreByPlays,
    percentLossless: Math.round(percentLossless * 10) / 10,
    percentHiRes: Math.round(percentHiRes * 10) / 10,
    avgBitrate,
    numFavorites,
    generatedAt: new Date().toLocaleDateString(),
  };
};
