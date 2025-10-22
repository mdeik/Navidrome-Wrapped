// Wrapped Display Class
class WrappedDisplay {
  constructor(stats) {
    this.stats = stats;
    this.currentSection = 0;
    this.sections = [];
    this.colors = {
      genre: [
        "#FF9AA2",
        "#FFB7B2",
        "#FFDAC1",
        "#E2F0CB",
        "#B5EAD7",
        "#C7CEEA",
        "#F7C8E0",
        "#DFCCFB",
        "#95D5B2",
      ],
      accent: "#ff6b6b",
    };

    this.init();
  }

  init() {
    this.createSections();
    this.render();
    this.setupNavigation();
    this.showSection(0);
  }

  safeAccess(obj, path, defaultValue = "N/A") {
    try {
      return path.split(".").reduce((o, p) => o && o[p], obj) || defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  createSections() {
    this.sections = [
      this.createWelcomeSection(),
      this.createListeningTimeSection(),
      this.createTopArtistsSection(),
      this.createTopAlbumsSection(),
      this.createTopSongsSection(),
      this.createDiversitySection(),
      this.createRatingSection(),
      this.createSummarySection(),
    ].filter((section) => section !== null);
  }

  createWelcomeSection() {
    const username = this.safeAccess(this.stats, "username", "Music Lover");
    const generatedAt = this.safeAccess(
      this.stats,
      "generatedAt",
      new Date().toLocaleDateString()
    );
    const totalSongs = this.safeAccess(this.stats, "totalSongs", 0);
    const totalAlbums = this.safeAccess(this.stats, "totalAlbums", 0);
    const totalArtists = this.safeAccess(this.stats, "totalArtists", 0);
    const totalDuration = this.safeAccess(this.stats, "totalDuration", 0);

    return `
      <div class="wrapped-section">
        <h2 class="section-title">🎵 Your Navidrome Wrapped</h2>
        <p class="section-subtitle">All-Time Listening Statistics</p>
        <div class="stat-card">
          <div class="stat-number">${username}</div>
          <div class="stat-label">Your Musical Journey</div>
        </div>
        ${
          totalSongs === 0
            ? '<div class="error-message"><p>No library data available</p></div>'
            : `<div class="stats-grid" id="welcomeStats">
                <div class="stat-card">
                  <div class="stat-number">${totalSongs.toLocaleString()}</div>
                  <div class="stat-label">Total Songs</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${totalAlbums.toLocaleString()}</div>
                  <div class="stat-label">Total Albums</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${totalArtists.toLocaleString()}</div>
                  <div class="stat-label">Total Artists</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${this.formatDurationShort(
                    totalDuration
                  )}</div>
                  <div class="stat-label">Total Duration</div>
                </div>
              </div>
              <p style="margin-top: 2rem; opacity: 0.8; margin-bottom:5rem">Generated on ${generatedAt}</p>`
        }
      </div>
    `;
  }

  createListeningTimeSection() {
    const listeningTime = this.safeAccess(this.stats, "listeningTime", 0);
    const breakdown = this.safeAccess(
      this.stats,
      "albumBasedStats.listeningTimeBreakdown.formatted",
      ""
    );
    const days = Math.floor(listeningTime / (24 * 3600));
    const hours = Math.floor((listeningTime % (24 * 3600)) / 3600);
    const minutes = Math.floor((listeningTime % 3600) / 60);

    // Genre chart data
    const genreData = this.getChartData(
      "albumBasedStats.topGenresByPlays",
      "genreBreakdown"
    );
    const genreChart = this.createChart("genre", genreData, this.colors.genre);

    // Decade chart data
    const decadeData = this.getChartData(
      "albumBasedStats.topDecadesByPlays",
      "decadeBreakdown"
    );
    const decadeColors = decadeData.map((_, i) => {
      const lightness = 25 + (i / Math.max(decadeData.length - 1, 1)) * 55;
      return `hsl(25, 45%, ${lightness}%)`;
    });
    const decadeChart = this.createChart("decade", decadeData, decadeColors);

    return `
      <div class="wrapped-section">
        <h2 class="section-title">🕒 What You Hear</h2>
        <p class="section-subtitle">How your minutes are split across genres and decades</p>

        ${
          listeningTime === 0
            ? '<div class="error-message"><p>No listening time data available</p></div>'
            : (days > 0
                ? `
                  <div class="stats-grid">
                    <div class="stat-card">
                      <div class="stat-number">${days}</div>
                      <div class="stat-label">Day${days === 1 ? "" : "s"}</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-number">${hours}</div>
                      <div class="stat-label">Hour${
                        hours === 1 ? "" : "s"
                      }</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-number">${minutes}</div>
                      <div class="stat-label">Minute${
                        minutes === 1 ? "" : "s"
                      }</div>
                    </div>
                  </div>
                `
                : "") ||
              (breakdown
                ? `
                  <div class="stat-card" style="max-width: 500px; margin-top: 1rem;">
                    <div class="stat-number" style="font-size: 1.5rem;">${breakdown}</div>
                    <div class="stat-label">Detailed Breakdown</div>
                  </div>
                `
                : "")
        }

        <!-- Genre Chart -->
        <div class="chart-container">
          <div class="chart-wrapper"><div class="chart-bar">${
            genreChart.bar
          }</div></div>
          <div class="chart-key">${genreChart.key}</div>
        </div>

        <!-- Decade Chart -->
        <div class="chart-container">
          <div class="chart-wrapper"><div class="chart-bar">${
            decadeChart.bar
          }</div></div>
          <div class="chart-key">${decadeChart.key}</div>
        </div>
      </div>
    `;
  }

  getChartData(dataPath, countPath) {
    const rawData = this.safeAccess(this.stats, dataPath, []);
    const total = rawData.reduce((sum, [, plays]) => sum + plays, 0) || 1;

    return rawData.map(([label, plays]) => ({
      label: label || "Unknown",
      count: this.safeAccess(this.stats, `${countPath}.${label}`, 0),
      plays: plays,
      percent: ((plays / total) * 100).toFixed(1),
    }));
  }

  createChart(type, data, colors) {
    let bar = "",
      key = "";

    data.forEach((item, index) => {
      const color = colors[index % colors.length];
      bar += `<div class="chart-segment" 
                    style="background:${color}; width:${item.percent}%" 
                    data-label="${item.label}" 
                    data-songs="${item.count}" 
                    data-plays="${item.plays.toLocaleString()}" 
                    data-pct="${item.percent}%"></div>`;
      key += `<div class="chart-key-item">
                    <span class="chart-key-color" style="background:${color}"></span>
                    ${item.label}
                  </div>`;
    });

    return { bar, key };
  }

  createTopArtistsSection() {
    const topArtists = this.safeAccess(this.stats, "topArtistsByPlays", []);

    return `
      <div class="wrapped-section">
        <h2 class="section-title">🎤 Top Artists</h2>
        <p class="section-subtitle">Your most played artists of all time</p>
        ${
          !topArtists.length || !Array.isArray(topArtists)
            ? '<div class="error-message"><p>No artist data available</p></div>'
            : this.renderTopList(topArtists, "artist")
        }
      </div>
    `;
  }

  createTopAlbumsSection() {
    const topAlbums = this.safeAccess(this.stats, "topAlbumsByPlaycount", []);

    return `
      <div class="wrapped-section">
        <h2 class="section-title">📀 Top Albums</h2>
        <p class="section-subtitle">Your most played albums</p>
        ${
          !topAlbums.length
            ? '<div class="error-message"><p>No album data available</p></div>'
            : this.renderTopList(topAlbums, "album")
        }
      </div>
    `;
  }

  createTopSongsSection() {
    let topSongs = this.safeAccess(this.stats, "topSongsByPlaycount", []);

    if (topSongs.length > 0 && Array.isArray(topSongs[0])) {
      topSongs = topSongs.map((song) => ({
        title: song[0] || "Unknown Song",
        artist: song[1] || "Unknown Artist",
        plays: song[2] || 0,
      }));
    }

    return `
      <div class="wrapped-section">
        <h2 class="section-title">🎵 Top Songs</h2>
        <p class="section-subtitle">Your most played tracks</p>
        ${
          !topSongs.length
            ? '<div class="error-message"><p>No song data available</p></div>'
            : this.renderTopList(topSongs, "song")
        }
      </div>
    `;
  }

  renderTopList(items, type) {
    const maxPlays = Math.max(
      ...items.map((item) =>
        type === "artist" ? item[1] : item.plays || item.playCount || 0
      ),
      1
    );

    const top3 = items.slice(0, 3);
    const rest = items.slice(3, type === "album" ? 8 : 8);

    const renderItem = (item, index, isCompact = false) => {
      let name, detail, playCount;
      if (type === "artist") {
        name = item[0] || "Unknown Artist";
        detail = "";
        playCount = item[1] || 0;
      } else if (type === "album") {
        name = item.name || "Unknown Album";
        detail = `by ${
          item.artists.map((a) => a.name).join("; ") || "Unknown Artist"
        }`;
        playCount = item.playCount || 0;
      } else {
        name = item.title || "Unknown Song";
        detail = `by ${
          item.artists.map((a) => a.name).join("; ") || "Unknown Artist"
        }`;
        playCount = item.plays || 0;
      }

      const width = (playCount / maxPlays) * 100;

      if (isCompact) {
        return `
            <li class="top-item-compact">
              <div class="compact-rank">#${index + 1}</div>
              <div class="compact-info">
                <div class="compact-name">${name}</div>
                ${detail ? `<div class="compact-detail">${detail}</div>` : ""}
              </div>
              <div class="compact-plays">${playCount.toLocaleString()}</div>
            </li>
          `;
      } else {
        return `
            <li class="top-item">
              <div class="rank">#${index + 1}</div>
              <div class="item-info">
                <div class="item-name">${name}</div>
                ${detail ? `<div class="item-detail">${detail}</div>` : ""}
                <div class="item-detail">${playCount.toLocaleString()} plays</div>
                <div class="wrapped-progress-bar">
                  <div class="wrapped-progress-fill" style="width: ${width}%"></div>
                </div>
              </div>
            </li>
          `;
      }
    };

    return `
        <div class="top-list-container">
          <div class="top-list-left">
            <ul class="top-list-main">
              ${top3
                .map((item, index) => renderItem(item, index, false))
                .join("")}
            </ul>
          </div>
          <div class="top-list-right">
            <ul class="top-list-compact">
              ${rest
                .map((item, index) => renderItem(item, index + 3, true))
                .join("")}
            </ul>
          </div>
        </div>
      `;
  }

  createDiversitySection() {
    const diversityScore = parseFloat(
      this.safeAccess(this.stats, "diversityScore", 0)
    );
    const trueDiversity = this.safeAccess(
      this.stats,
      "albumBasedStats.trueArtistDiversity",
      {}
    );
    const listenedArtists = trueDiversity.listened || 0;
    const libraryArtists = trueDiversity.total || 0;
    const discoveryRate = trueDiversity.percentage || 0;
    const score = isNaN(diversityScore) ? 0 : diversityScore;

    return `
      <div class="wrapped-section">
        <h2 class="section-title">🌈 Artist Diversity</h2>
        <p class="section-subtitle">How diverse your listening habits are</p>
        <div class="diversity-score" style="margin-top:-20px">${score.toFixed(
          2
        )}%</div>

        <p style="max-width:var(--max-width-xl);margin:0 auto 2rem; font-size:1.05rem;opacity:.9">
          ${this.getDiversityMessage(score)}
        </p>

        <div class="stats-grid" id="diversity-stats" style="margin-top:-20px">
          <div class="stat-card">
            <div class="stat-number">${listenedArtists}</div>
            <div class="stat-label">Artists Listened To</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${libraryArtists}</div>
            <div class="stat-label">Artists in Library</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${discoveryRate.toFixed(1)}%</div>
            <div class="stat-label">Discovery Rate</div>
          </div>
        </div>

        <div style="max-width:var(--max-width-xl);margin:2rem auto;margin-top:-20px">
          <p>“How evenly your listening time is spread across the artists you actually play.”</p>
        </div>
      </div>`;
  }

  createRatingSection() {
    const ratingDist = this.safeAccess(this.stats, "ratingDistribution", {});
    const totalSongs = this.safeAccess(this.stats, "totalSongs", 0);
    const totalRated =
      Object.values(ratingDist).reduce((a, b) => a + b, 0) -
      (ratingDist.unrated || 0);
    const unratedSongs = Math.max(0, totalSongs - totalRated);
    const correctedRatingDist = { ...ratingDist, unrated: unratedSongs };
    const avgRating = this.calculateAverageRating(correctedRatingDist);

    return `
        <div class="wrapped-section">
          <h2 class="section-title">⭐ Rating Habits</h2>
          <p class="section-subtitle">How you rate your music</p>
          
          <div class="rating-horizontal-container">
            <div class="rating-cards-horizontal">
              <div class="stat-card">
                <div class="stat-number">${totalRated}</div>
                <div class="stat-label">Rated Songs</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${unratedSongs}</div>
                <div class="stat-label">Unrated Songs</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${avgRating.toFixed(1)}/5</div>
                <div class="stat-label">Average Rating</div>
              </div>
            </div>
            
            <div class="rating-chart-horizontal">
              ${this.renderHorizontalRatingDistribution(correctedRatingDist)}
            </div>
          </div>
        </div>
      `;
  }

  renderHorizontalRatingDistribution(ratingDist) {
    const total = Object.values(ratingDist).reduce((s, c) => s + c, 0);
    const ratings = [
      "5_star",
      "4_star",
      "3_star",
      "2_star",
      "1_star",
      "unrated",
    ];
    const labels = ["5 ★", "4 ★", "3 ★", "2 ★", "1 ★", "Unrated"];
    return `
    <div class="horizontal-rating-chart">
      ${ratings
        .map((r, i) => {
          const count = ratingDist[r] || 0;
          const pct = total ? (count / total) * 100 : 0;
          const idAttr = r === "unrated" ? ' id="unrated"' : "";
          let vis = pct > 90 ? 90 + (pct - 90) / 2 : pct;
          if (count > 0) {
            vis += 5;
          } // ensure visibility for very small counts
          vis = Math.min(vis, 100);
          return `
            <div class="horizontal-rating-bar-container">
              <div class="horizontal-rating-label">${labels[i]}</div>
              <div class="horizontal-rating-bar-wrapper">
                <div class="horizontal-rating-bar"${idAttr}
                     style="width:${vis}%">
                  <span class="horizontal-rating-count">${count}</span>
                </div>
              </div>
              <div class="horizontal-rating-percentage">${pct.toFixed(1)}%</div>
            </div>`;
        })
        .join("")}
    </div>`;
  }

  createSummarySection() {
    const totalPlays = this.safeAccess(
      this.stats,
      "albumBasedStats.totalPlays",
      0
    );
    const listeningTime = this.safeAccess(this.stats, "listeningTime", 0);
    const diversity = parseFloat(
      this.safeAccess(this.stats, "diversityScore", 0)
    );
    const topArtist = this.safeAccess(this.stats, "topArtistsByPlays[0]", null);
    const topGenre = this.safeAccess(
      this.stats,
      "albumBasedStats.topGenresByPlays[0]",
      null
    );
    const topDecade = this.safeAccess(
      this.stats,
      "albumBasedStats.topDecadesByPlays[0]",
      null
    );
    const decadeRange = this.safeAccess(
      this.stats,
      "albumBasedStats.topDecadesByPlays",
      []
    );
    const days = Math.floor(listeningTime / 86400);
    const hours = Math.floor((listeningTime % 86400) / 3600);
    const neglectedTrack = this.safeAccess(this.stats, "neglectedTrack", null);
    const neglectedDays = daysSinceYYYYMMDD(
      this.safeAccess(this.stats, "neglectedTrack.playedDate", null)
    );
    // Generate contextual messages
    const timeMessage = this.getTimeMessage(days, hours);
    const diversityMessage = this.getDiversityMessage(diversity);
    const ratingMessage = this.getRatingMessage(
      this.safeAccess(this.stats, "albumBasedStats.totalRatings"),
      totalPlays,
      this.safeAccess(this.stats, "numFavorites", 0)
    );
    const eraMessage = this.getEraMessage(decadeRange);
    const audiophileMessage = this.getAudiophileMessage(
      this.safeAccess(this.stats, "qualityScore"),
      this.safeAccess(this.stats, "qualityScoreByPlays"),
      this.safeAccess(this.stats, "percentLossless"),
      this.safeAccess(this.stats, "percentHiRes"),
      this.safeAccess(this.stats, "avgBitrate")
    );
    return `
            <div class="wrapped-section">
              <h2 class="section-title">🎊 Your Music Summary</h2>
              <p class="section-subtitle">A complete overview of your listening journey</p>

              <div class="summary-highlights" id="summary-stats">
                <div class="highlight-card">
                  <div class="highlight-icon">📊</div>
                  <div class="highlight-value">${totalPlays.toLocaleString()}</div>
                  <div class="highlight-label">Total Plays</div>
                </div>
                <div class="highlight-card">
                  <div class="highlight-icon">⏰</div>
                  <div class="highlight-value">${
                    days > 0 ? `${days}d ${hours}h` : `${hours}h`
                  }</div>
                  <div class="highlight-label">Listening Time</div>
                </div>
                ${
                  neglectedTrack
                    ? `
                  <div class="highlight-card" title="${neglectedTrack.title} by ${neglectedTrack.artist}, last played ${neglectedDays} days ago">
                  <div class="highlight-icon">🕸️</div>
                  <div class="highlight-value">${neglectedTrack.title}</div>
                  <div class="highlight-label">Most Neglected Song</div>
                </div>`
                    : "<p> ${neglectedTrack} </p>"
                }
              </div>

              <p style="max-width: var(--max-width-xl); margin: 0 auto 2.5rem; font-size: 1.15rem; line-height: 1.6;">
                ${diversityMessage}<br>
                ${ratingMessage}<br>
                ${audiophileMessage}
              </p>

              <button class="share-button" id="shareWrappedBtn">
                📤 Share Your Wrapped
              </button>
              <button onclick="localStorage.removeItem('navidrome_wrapped');location.reload()" class="secondary-btn" id="generate-again">Generate Again</button>
            </div>`;
  }

  // Helper methods
  getTimeMessage(days, hours) {
    if (days > 365)
      return `You have stacked <b>${days} days</b> (over a full <b>year</b>) of pure audio – that's dedication on another level!`;
    if (days > 30)
      return `You have spent <b>${days} days</b> and <b>${hours} hours</b> dancing through your library – impressive stamina!`;
    if (hours > 24)
      return `You have clocked <b>${hours} hours</b> – already a private music festival under your belt.`;
    return `Every minute counted – <b>${hours} hours</b> of curated joy so far.`;
  }

  getDiversityMessage(score) {
    const numScore = parseFloat(score) || 0;

    if (numScore >= 80)
      return `Your diversity score is <b>${numScore.toFixed(
        2
      )}%</b> – ears like globetrotters; no artist can hold you hostage.`;
    if (numScore >= 60)
      return `Your diversity score is <b>${numScore.toFixed(
        2
      )}%</b> – you walk a wide middle path; favourites exist, but exploration is strong.`;
    if (numScore >= 40)
      return `Your diversity score is <b>${numScore.toFixed(
        2
      )}%</b> – comfort-zone-plus; a reliable core with occasional wanderlust.`;
    return `Your diversity score is <b>${numScore.toFixed(
      2
    )}%</b> – a laser-focused aficionado; why dilute perfection?`;
  }

  getRatingMessage(rated, totalPlays, favorites) {
    const ratedPct = totalPlays ? +((rated / totalPlays) * 100).toFixed(0) : 0;
    const favPct = totalPlays
      ? +((favorites / totalPlays) * 100).toFixed(0)
      : 0;

    if (ratedPct > 80 && favPct <= 10)
      return `Rated <b>${ratedPct}% of plays</b>, favourited <b>${favPct}% of plays</b> – precise and selective. Few songs earn your seal.`;

    if (ratedPct > 70 && favPct > 20)
      return `Rated <b>${ratedPct}% of plays</b> and favourited <b>${favPct}% of plays</b> – analytical yet emotional. You live for the best.`;

    if (ratedPct > 40 && favPct > 10)
      return `Rated <b>${ratedPct}% of plays</b>, favourited <b>${favPct}% of plays</b> – equal parts logic and love. You know what you like.`;

    if (ratedPct > 50 && favPct < 5)
      return `Rated <b>${ratedPct}% of plays</b> but barely any favourites – you study music more than you feel it.`;

    if (ratedPct < 15 && favPct > 20)
      return `Few ratings (<b>${ratedPct}% of plays</b>), many favourites (<b>${favPct}% of plays</b>) – you trust your gut, not the numbers.`;

    if (ratedPct <= 20 && favPct <= 10 && (ratedPct > 0 || favPct > 0))
      return `Rated <b>${ratedPct}% of plays</b>, favourited <b>${favPct}% of plays</b> – laid-back and free. You enjoy without overthinking.`;

    if (favPct > 30 && ratedPct > 40)
      return `Rated <b>${ratedPct}% of plays</b>, favourited <b>${favPct}% of plays</b> – you don’t just listen, you celebrate.`;

    if (ratedPct > 25 && favPct === 0)
      return `Rated <b>${ratedPct}% of plays</b> but no favorites – all logic, no bias. You observe from afar.`;

    if (ratedPct === 0 && favPct > 0)
      return `No ratings, <b>${favPct}% of plays</b> favourites – you skip the math and follow emotion.`;

    if (ratedPct > 0 && favPct === 0)
      return `Rated <b>${ratedPct}% of plays</b> – still waiting for a track to truly hit home.`;

    if (ratedPct <= 5 && favPct <= 5 && (ratedPct > 0 || favPct > 0))
      return `Just starting out – <b>${ratedPct}% of plays</b> rated, <b>${favPct}% of plays</b> favourited. Discovery phase.`;

    if (ratedPct === 0 && favPct === 0) {
      return `No ratings, no favourites – pure listener. You let music flow without judgment.`;
    }
    if (ratedPct > 0 || favPct > 0) {
      return `Rated <b>${ratedPct}% of plays</b>, favourited <b>${favPct}% of plays</b> – easy-going and open. You sample, smile, and move on.`;
    }

    return `No ratings, no favourites – pure listener. You let music flow without judgment.`;
  }

  getEraMessage(decadeRange) {
    const decades = decadeRange.map(([d]) => parseInt(d)).filter(Boolean);
    if (decades.length === 0)
      return `Your musical era preferences show a timeless taste.`;

    const newest = Math.max(...decades);
    const oldest = Math.min(...decades);
    const span = newest - oldest;
    const mid = (newest + oldest) / 2;

    if (span > 50)
      return `You time-travel <b>${span} years</b> – from <b>${oldest}s vinyl classics</b> to <b>${newest}s fresh drops</b>; nothing off limits.`;
    if (mid >= 2000)
      return `You lean <b>21st-century</b> (centred around <b>${Math.round(
        mid
      )}</b>) – living in the now but respecting the legends.`;
    if (mid < 1990)
      return `You keep the <b>golden decades</b> alive (centred around <b>${Math.round(
        mid
      )}</b>) – retro-leaning and proud.`;
    return `Perfectly balanced across eras (centred around <b>${Math.round(
      mid
    )}</b>) – nostalgia and novelty hand-in-hand.`;
  }

  getAudiophileMessage(qs, qsPlays, pctLoss, pctHR, avgKbps) {
    if (pctHR >= 50 && qs >= 95)
      return `🚀 <b>Hi-Res Overlord.</b> Half your library is 24-bit / 96 kHz+ and you actually play it—your DAC is probably warmer than your house.`;

    if (pctLoss >= 95 && avgKbps < 400)
      return `🧙‍♂️ <b>Lossless Wizard.</b> 99 % FLAC but average bitrate under 400 kbps—either classical rips or you've discovered 24-bit silence.`;

    if (qsPlays <= 25 && qs >= 80)
      return `🥀 <b>Artifact Archivist.</b> You collect pristine files but stream the daily playlist—museum in the vault, party in the cache.`;

    if (avgKbps >= 1000 && pctLoss < 5)
      return `🤯 <b>320 kbps Champion.</b> You push lossy so hard it hits 1 Mbps—either extreme VBR metal or you're trolling the algorithm.`;

    if (pctHR >= 15 && pctLoss < 10)
      return `🦄 <b>Hi-Res Unicorn.</b> 15 % hi-res yet mostly lossy otherwise—those few tracks are your audio dragon eggs.`;

    if (qs <= 20 && avgKbps >= 256)
      return `🎭 <b>Bitrate Masquerade.</b> Low quality score but 256+ kbps average—big numbers, small ears.`;

    if (qs === 100 && qsPlays === 100)
      return `👑 <b>Perfect Score Prophecy.</b> Library and plays both hit 100—an audiophile eclipse that may never repeat.`;

    if (qs >= 90)
      return `<b>Elite-tier ears.</b> You hoard master-quality files and actually play them—your gear probably costs more than a used car.`;
    if (qs >= 75)
      return `<b>Certified audiophile.</b> Lossless is the bare minimum and hi-res is your comfort zone; mediocre codecs need not apply.`;
    if (qs >= 55)
      return `<b>Quality-conscious listener.</b> You care about fidelity, keep lossless around, and press skip on potato rips.`;
    if (qs >= 30)
      return `<b>Smart but practical.</b> 320 kbps is "good enough" and you save space for more music—ears happy, storage happier.`;
    return `📱 <b>Casual streamer.</b> You chase convenience over kilobits—if it bumps, it bumps.`;
  }

  renderRatingDistribution(dist) {
    const ratings = [
      { label: "5 Stars", key: "5_star", emoji: "⭐⭐⭐⭐⭐" },
      { label: "4 Stars", key: "4_star", emoji: "⭐⭐⭐⭐" },
      { label: "3 Stars", key: "3_star", emoji: "⭐⭐⭐" },
      { label: "2 Stars", key: "2_star", emoji: "⭐⭐" },
      { label: "1 Star", key: "1_star", emoji: "⭐" },
      { label: "Unrated", key: "unrated", emoji: "○" },
    ];

    const maxCount = Math.max(...ratings.map((r) => dist[r.key] || 0));

    return ratings
      .map((rating) => {
        const count = dist[rating.key] || 0;
        const width = maxCount ? (count / maxCount) * 100 : 0;
        return `
              <div style="margin: 0.5rem 0;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="margin-right: 3rem">${rating.emoji} ${rating.label}</span>
                  <span>${count}</span>
                </div>
                <div class="wrapped-progress-bar">
                  <div class="wrapped-progress-fill" style="width: ${width}%"></div>
                </div>
              </div>
              `;
      })
      .join("");
  }

  calculateAverageRating(dist) {
    let total = 0,
      count = 0;
    ["5_star", "4_star", "3_star", "2_star", "1_star"].forEach((key) => {
      const rating = parseInt(key.charAt(0));
      const songCount = dist[key] || 0;
      total += rating * songCount;
      count += songCount;
    });
    return count ? total / count : 0;
  }

  formatDurationShort(seconds) {
    if (!seconds || seconds < 60) return `${seconds || 0}s`;
    const minutes = Math.floor(seconds / 60);
    if (seconds < 3600) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h ${minutes % 60}m`;
  }

  render() {
    const wrappedContent = document.getElementById("wrappedContent");
    if (wrappedContent) {
      wrappedContent.innerHTML = this.sections.join("");
    }
  }

  setupNavigation() {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (prevBtn && nextBtn) {
      prevBtn.addEventListener("click", () => this.prevSection());
      nextBtn.addEventListener("click", () => this.nextSection());

      document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") this.prevSection();
        if (e.key === "ArrowRight") this.nextSection();
      });
    }
  }

  showSection(index) {
    const sections = document.querySelectorAll(".wrapped-section");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (sections.length === 0) return;

    sections.forEach((section) => {
      section.classList.remove("active");
    });

    if (index >= 0 && index < sections.length) {
      setTimeout(() => {
        sections[index].classList.add("active");
      }, 50);
    }

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === sections.length - 1;

    this.currentSection = index;
  }

  nextSection() {
    if (this.currentSection < this.sections.length - 1) {
      this.showSection(this.currentSection + 1);
    }
  }

  prevSection() {
    if (this.currentSection > 0) {
      this.showSection(this.currentSection - 1);
    }
  }
}
