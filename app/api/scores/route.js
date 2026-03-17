// app/api/scores/route.js
export const dynamic = 'force-dynamic';

import { PICKS, DRAFTERS } from '../../data';

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard';
const ESPN_BOXSCORE = (gameId) => `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=${gameId}`;

function buildPlayerLookup() {
  const lookup = {};
  for (const drafter of DRAFTERS) {
    const picks = PICKS[drafter] || [];
    picks.forEach((p, idx) => {
      const key = p.name.toLowerCase().replace(/[^a-z ]/g, '').trim();
      lookup[key] = { drafter, idx, name: p.name, team: p.team };
    });
  }
  return lookup;
}

function matchPlayer(espnName, lookup) {
  const key = espnName.toLowerCase().replace(/[^a-z ]/g, '').trim();
  if (lookup[key]) return lookup[key];
  const parts = key.split(' ');
  const lastName = parts[parts.length - 1];
  for (const [k, v] of Object.entries(lookup)) {
    if (k.includes(lastName) && k.includes(parts[0]?.[0] || '')) return v;
  }
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group') || '100';

    let url = `${ESPN_SCOREBOARD}?groups=${group}&limit=50`;
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

      const status = competition.status?.type?.name;
      const gameId = event.id;
      const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');

      const gameInfo = {
        id: gameId, status,
        statusDetail: competition.status?.type?.detail || '',
        displayClock: competition.status?.displayClock || '',
        period: competition.status?.period || 0,
        home: { name: homeTeam?.team?.displayName || '', abbr: homeTeam?.team?.abbreviation || '', score: parseInt(homeTeam?.score || '0'), logo: homeTeam?.team?.logo || '' },
        away: { name: awayTeam?.team?.displayName || '', abbr: awayTeam?.team?.abbreviation || '', score: parseInt(awayTeam?.score || '0'), logo: awayTeam?.team?.logo || '' },
      };

      if (status === 'STATUS_SCHEDULED') {
        upcomingGames.push({ ...gameInfo, startTime: event.date, broadcast: competition.broadcasts?.[0]?.names?.[0] || '' });
        continue;
      }
      if (status === 'STATUS_IN_PROGRESS') liveGames.push(gameInfo);
      else if (status === 'STATUS_FINAL') completedGames.push(gameInfo);

      try {
        const boxRes = await fetch(ESPN_BOXSCORE(gameId), { cache: 'no-store' });
        const boxData = await boxRes.json();
        const players = boxData?.boxscore?.players || [];

        for (const teamBox of players) {
          for (const statGroup of teamBox.statistics || []) {
            for (const athlete of statGroup.athletes || []) {
              const espnName = athlete.athlete?.displayName || '';
              const match = matchPlayer(espnName, lookup);
              if (!match) continue;

              const stats = {};
              const labels = statGroup.labels || [];
              const values = athlete.stats || [];
              labels.forEach((label, i) => { stats[label] = values[i]; });

              const pts = parseInt(stats['PTS'] || '0');
              const key = `${match.drafter}:${match.idx}`;

              if (!playerScores[key]) {
                playerScores[key] = { drafter: match.drafter, idx: match.idx, name: match.name, totalPts: 0, games: [] };
              }

              const existingGame = playerScores[key].games.find(g => g.gameId === gameId);
              if (existingGame) { existingGame.pts = pts; existingGame.stats = stats; existingGame.status = status; }
              else { playerScores[key].games.push({ gameId, pts, stats, status, opponent: gameInfo.home.name === match.team ? gameInfo.away.name : gameInfo.home.name }); }

              playerScores[key].totalPts = playerScores[key].games.reduce((s, g) => s + g.pts, 0);
            }
          }
        }
      } catch (e) { console.error(`Box score fetch failed for ${gameId}:`, e.message); }
    }

    const totalGames = 67;
    const gamesPlayed = completedGames.length;

    return Response.json({
      playerScores, liveGames, completedGames, upcomingGames,
      tournament: { gamesPlayed, totalGames, pct: Math.round((gamesPlayed / totalGames) * 100) },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Score fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
