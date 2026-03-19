// app/api/scores/route.js
export const dynamic = 'force-dynamic';

import { PICKS, DRAFTERS } from '../../data';

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
const ESPN_BOXSCORE = (gameId) => `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=${gameId}`;

// Round of 64 starts March 19. Hard cutoff at 10am ET — nothing before this counts.
const ROUND_OF_64_CUTOFF = new Date('2026-03-19T10:00:00-04:00');

// Build lookup: normalized name -> { drafter, idx, name, team }
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
    .replace(/['']/g, '')        // remove apostrophes
    .replace(/[^a-z ]/g, '')     // remove non-alpha except spaces
    .replace(/\s+(jr|sr|ii|iii|iv)\.?\s*$/i, '') // remove suffixes
    .trim();
}

// Match ESPN name to our pool. Returns match ONLY if:
// 1. Name matches (exact or cleaned)
// 2. Player's team is actually in this game (CRITICAL safety check)
function matchPlayer(espnName, lookup, teamsInGame) {
  const key = normalizeName(espnName);

  // Direct match
  if (lookup[key]) {
    // Verify team is in this game
    const playerTeam = lookup[key].team.toLowerCase();
    const inGame = teamsInGame.some(t => t.toLowerCase().includes(playerTeam) || playerTeam.includes(t.toLowerCase()));
    if (inGame) return lookup[key];
    return null; // Name matched but team isn't playing — reject
  }

  // Strict first+last match
  const parts = key.split(' ').filter(p => p.length > 0);
  if (parts.length < 2) return null;
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];

  for (const [k, v] of Object.entries(lookup)) {
    const lParts = k.split(' ').filter(p => p.length > 0);
    if (lParts.length < 2) continue;
    const lFirst = lParts[0];
    const lLast = lParts[lParts.length - 1];

    if (lastName === lLast && firstName === lFirst) {
      // Verify team is in this game
      const playerTeam = v.team.toLowerCase();
      const inGame = teamsInGame.some(t => t.toLowerCase().includes(playerTeam) || playerTeam.includes(t.toLowerCase()));
      if (inGame) return v;
    }
  }

  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group') || '100';

    const url = `${ESPN_SCOREBOARD}?groups=${group}&limit=100`;
    const sbRes = await fetch(url, { cache: 'no-store' });
    const sbData = await sbRes.json();
    const events = sbData?.events || [];

    const lookup = buildPlayerLookup();
    const playerScores = {};
    const liveGames = [];
    const completedGames = [];
    const upcomingGames = [];

    for (const event of events) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const gameDate = new Date(event.date);
      const isBeforeRoundOf64 = gameDate < ROUND_OF_64_CUTOFF;

      const status = competition.status?.type?.name;
      const gameId = event.id;
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
        isFirstFour: isBeforeRoundOf64,
        home: { name: homeName, abbr: homeAbbr, score: parseInt(homeTeam?.score || '0'), logo: homeTeam?.team?.logo || '' },
        away: { name: awayName, abbr: awayAbbr, score: parseInt(awayTeam?.score || '0'), logo: awayTeam?.team?.logo || '' },
      };

      // Sort into categories
      if (status === 'STATUS_SCHEDULED') {
        upcomingGames.push({ ...gameInfo, startTime: event.date, broadcast: competition.broadcasts?.[0]?.names?.[0] || '' });
        continue;
      }
      if (status === 'STATUS_IN_PROGRESS' && !isBeforeRoundOf64) liveGames.push(gameInfo);
      if (status === 'STATUS_FINAL' && !isBeforeRoundOf64) completedGames.push(gameInfo);

      // HARD STOP: skip all First Four games for scoring
      if (isBeforeRoundOf64) continue;

      // Teams in this game — used to verify player matches
      const teamsInGame = [homeName, awayName, homeAbbr, awayAbbr];

      try {
        const boxRes = await fetch(ESPN_BOXSCORE(gameId), { cache: 'no-store' });
        const boxData = await boxRes.json();
        const boxPlayers = boxData?.boxscore?.players || [];

        for (const teamBox of boxPlayers) {
          for (const statGroup of teamBox.statistics || []) {
            for (const athlete of statGroup.athletes || []) {
              const espnName = athlete.athlete?.displayName || '';
              // Pass teamsInGame for verification
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

              // Prevent double-counting same game
              const existingGame = playerScores[key].games.find(g => g.gameId === gameId);
              if (existingGame) {
                existingGame.pts = pts;
                existingGame.stats = stats;
                existingGame.status = status;
              } else {
                playerScores[key].games.push({
                  gameId, pts, stats, status,
                  date: event.date,
                  opponent: homeName.toLowerCase().includes(match.team.toLowerCase()) ? awayName : homeName,
                  homeTeam: homeName,
                  awayTeam: awayName,
                  homeScore: gameInfo.home.score,
                  awayScore: gameInfo.away.score,
                });
              }

              // Recalculate total from games array (single source of truth)
              playerScores[key].totalPts = playerScores[key].games.reduce((s, g) => s + g.pts, 0);
            }
          }
        }
      } catch (e) {
        console.error(`Box score error for game ${gameId}:`, e.message);
      }
    }

    const totalGames = 63; // R64(32) + R32(16) + S16(8) + E8(4) + F4(2) + NC(1)
    const gamesPlayed = completedGames.length;

    return Response.json({
      playerScores,
      liveGames,
      completedGames: completedGames.slice(0, 20),
      upcomingGames,
      tournament: {
        gamesPlayed,
        totalGames,
        pct: Math.round((gamesPlayed / totalGames) * 100),
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scores API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
