// app/api/scores/route.js
export const dynamic = 'force-dynamic';

import { PICKS, DRAFTERS } from '../../data';

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
const ESPN_BOXSCORE = (gameId) => `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=${gameId}`;

// Tournament dates — Round of 64 through championship
const TOURNAMENT_DATES = [
  '20260319', '20260320', // Round of 64
  '20260321', '20260322', // Round of 32
  '20260326', '20260327', // Sweet 16
  '20260328', '20260329', // Elite 8
  '20260404',             // Final Four
  '20260406',             // Championship
];

function buildPlayerLookup() {
  const lookup = {};
  for (const drafter of DRAFTERS) {
    const picks = PICKS[drafter] || [];
    picks.forEach((p, idx) => {
      if (!p || !p.name) return;
      const key = normalizeName(p.name);
      lookup[key] = { drafter, idx, name: p.name, team: p.team };
    });
  }
  return lookup;
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[''`.]/g, '')
    .replace(/[^a-z ]/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchPlayer(espnName, lookup, teamsInGame) {
  const key = normalizeName(espnName);

  // Exact match — verify team
  if (lookup[key]) {
    if (verifyTeam(lookup[key].team, teamsInGame)) return lookup[key];
    return null;
  }

  // First + last name match — verify team
  const parts = key.split(' ').filter(p => p.length > 0);
  if (parts.length < 2) return null;
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];

  for (const [k, v] of Object.entries(lookup)) {
    const lParts = k.split(' ').filter(p => p.length > 0);
    if (lParts.length < 2) continue;
    if (lastName === lParts[lParts.length - 1] && firstName === lParts[0]) {
      if (verifyTeam(v.team, teamsInGame)) return v;
    }
  }

  return null;
}

// Teams that share name prefixes and need disambiguation
const AMBIGUOUS_TEAMS = {
  'miami fl': ['miami hurricanes', 'miami (fl)', 'miami fl'],
  'miami oh': ['miami (oh)', 'miami redhawks', 'miami oh', 'miami (oh) redhawks'],
  'tennessee': ['tennessee volunteers', 'tennessee vols'],
  'tennessee state': ['tennessee state tigers', 'tennessee st'],
  'north carolina': ['north carolina tar heels', 'unc tar heels'],
  'nc state': ['nc state wolfpack', 'north carolina state', 'n.c. state'],
  'south florida': ['south florida bulls', 'usf bulls', 'usf'],
  'michigan': ['michigan wolverines'],
  'michigan state': ['michigan state spartans'],
  'ohio state': ['ohio state buckeyes'],
  'iowa': ['iowa hawkeyes'],
  'iowa state': ['iowa state cyclones'],
  'saint mary\'s': ['saint mary\'s gaels', 'saint mary\'s (ca)', 'st. mary\'s'],
  'cal baptist': ['california baptist', 'california baptist lancers', 'cal baptist lancers'],
  'texas': ['texas longhorns'],
  'texas tech': ['texas tech red raiders'],
  'texas a&m': ['texas a&m aggies'],
};

function verifyTeam(playerTeam, teamsInGame) {
  const pt = playerTeam.toLowerCase().trim();
  const gameTeams = teamsInGame.map(t => t.toLowerCase().trim());

  // Check if this player's team has known disambiguation aliases
  const aliases = AMBIGUOUS_TEAMS[pt];
  if (aliases) {
    return gameTeams.some(gt =>
      gt === pt ||
      aliases.some(a => gt.includes(a) || a.includes(gt)) ||
      gt.startsWith(pt + ' ') // e.g. "miami fl" matches "miami fl hurricanes" but NOT "miami oh"
    );
  }

  // For non-ambiguous teams: exact, starts-with, or contained — but only if
  // the match isn't a substring of a longer distinct team name
  return gameTeams.some(gt => {
    if (gt === pt) return true;
    if (gt.includes(pt)) {
      // Make sure we're not matching "michigan" inside "michigan state"
      const idx = gt.indexOf(pt);
      const after = gt[idx + pt.length];
      // OK if pt is at end, or next char is space (team name continues with mascot)
      if (after === undefined || after === ' ') return true;
      return false;
    }
    if (pt.includes(gt) && gt.length >= 3) {
      const idx = pt.indexOf(gt);
      const after = pt[idx + gt.length];
      if (after === undefined || after === ' ') return true;
      return false;
    }
    return false;
  });
}

// Get all tournament dates up to and including today
function getActiveDates() {
  const today = new Date();
  const todayStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');

  return TOURNAMENT_DATES.filter(d => d <= todayStr);
}

export async function GET() {
  try {
    const lookup = buildPlayerLookup();
    const playerScores = {};  // key -> { drafter, idx, name, team, totalPts, games[] }
    const liveGames = [];
    const completedGames = [];
    const upcomingGames = [];
    const processedGameIds = new Set(); // prevent double-processing

    const activeDates = getActiveDates();

    // Also fetch today's scoreboard for live games (no date param = today)
    const datesToFetch = [...new Set([...activeDates, 'TODAY'])];

    for (const dateStr of datesToFetch) {
      let url;
      if (dateStr === 'TODAY') {
        url = `${ESPN_SCOREBOARD}?groups=100&limit=100`;
      } else {
        url = `${ESPN_SCOREBOARD}?groups=100&limit=100&dates=${dateStr}`;
      }

      let sbData;
      try {
        const sbRes = await fetch(url, { cache: 'no-store' });
        sbData = await sbRes.json();
      } catch (e) {
        console.error(`Failed to fetch scoreboard for ${dateStr}:`, e.message);
        continue;
      }

      const events = sbData?.events || [];

      for (const event of events) {
        const gameId = event.id;
        if (processedGameIds.has(gameId)) continue;
        processedGameIds.add(gameId);

        const competition = event.competitions?.[0];
        if (!competition) continue;

        const status = competition.status?.type?.name;
        const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');

        const homeName = homeTeam?.team?.displayName || '';
        const awayName = awayTeam?.team?.displayName || '';
        const homeAbbr = homeTeam?.team?.abbreviation || '';
        const awayAbbr = awayTeam?.team?.abbreviation || '';

        const gameInfo = {
          id: gameId, status,
          statusDetail: competition.status?.type?.detail || '',
          displayClock: competition.status?.displayClock || '',
          period: competition.status?.period || 0,
          date: event.date,
          home: { name: homeName, abbr: homeAbbr, score: parseInt(homeTeam?.score || '0'), logo: homeTeam?.team?.logo || '' },
          away: { name: awayName, abbr: awayAbbr, score: parseInt(awayTeam?.score || '0'), logo: awayTeam?.team?.logo || '' },
        };

        if (status === 'STATUS_SCHEDULED') {
          upcomingGames.push({ ...gameInfo, startTime: event.date, broadcast: competition.broadcasts?.[0]?.names?.[0] || '' });
          continue;
        }
        if (status === 'STATUS_IN_PROGRESS') liveGames.push(gameInfo);
        else if (status === 'STATUS_FINAL') completedGames.push(gameInfo);

        // Fetch box score for live AND completed games
        const teamsInGame = [homeName, awayName, homeAbbr, awayAbbr];

        try {
          const boxRes = await fetch(ESPN_BOXSCORE(gameId), { cache: 'no-store' });
          const boxData = await boxRes.json();
          const boxPlayers = boxData?.boxscore?.players || [];

          for (const teamBox of boxPlayers) {
            for (const statGroup of teamBox.statistics || []) {
              for (const athlete of statGroup.athletes || []) {
                const espnName = athlete.athlete?.displayName || '';
                const match = matchPlayer(espnName, lookup, teamsInGame);
                if (!match) continue;

                const stats = {};
                const labels = statGroup.labels || [];
                const values = athlete.stats || [];
                labels.forEach((label, i) => { stats[label] = values[i]; });

                const pts = parseInt(stats['PTS'] || '0');
                if (isNaN(pts)) continue;

                const key = `${match.drafter}:${match.idx}`;

                if (!playerScores[key]) {
                  playerScores[key] = {
                    drafter: match.drafter, idx: match.idx,
                    name: match.name, team: match.team,
                    totalPts: 0, games: []
                  };
                }

                // Find or add this game
                const existingGame = playerScores[key].games.find(g => g.gameId === gameId);
                if (existingGame) {
                  // Update — ESPN's latest data is authoritative
                  existingGame.pts = pts;
                  existingGame.stats = stats;
                  existingGame.status = status;
                  existingGame.homeScore = gameInfo.home.score;
                  existingGame.awayScore = gameInfo.away.score;
                } else {
                  playerScores[key].games.push({
                    gameId, pts, stats, status,
                    date: event.date,
                    opponent: homeName.toLowerCase().includes(match.team.toLowerCase()) ? awayName : homeName,
                    homeTeam: homeName, awayTeam: awayName,
                    homeScore: gameInfo.home.score, awayScore: gameInfo.away.score,
                  });
                }

                // Total is always sum of all games — single source of truth
                playerScores[key].totalPts = playerScores[key].games.reduce((s, g) => s + g.pts, 0);
              }
            }
          }
        } catch (e) {
          console.error(`Box score error for game ${gameId}:`, e.message);
        }
      }
    }

    // ===== ELIMINATION TRACKING =====
    // Single elimination — losing team in any completed game is out
    const eliminatedTeams = new Set();
    for (const game of completedGames) {
      if (game.home.score > game.away.score) {
        // Away team lost
        eliminatedTeams.add(game.away.name);
        eliminatedTeams.add(game.away.abbr);
      } else if (game.away.score > game.home.score) {
        // Home team lost
        eliminatedTeams.add(game.home.name);
        eliminatedTeams.add(game.home.abbr);
      }
      // Tie shouldn't happen in tournament but ignore if it does
    }

    const totalGames = 63;
    const gamesPlayed = completedGames.length;

    return Response.json({
      playerScores,
      eliminatedTeams: [...eliminatedTeams],
      liveGames,
      completedGames: completedGames.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30),
      upcomingGames: upcomingGames.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
      tournament: {
        gamesPlayed, totalGames,
        pct: Math.round((gamesPlayed / totalGames) * 100),
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scores API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
