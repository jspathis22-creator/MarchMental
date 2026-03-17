# THE POOL — March Madness 2026

## Deploy to Vercel (5 minutes)

### Option A: Drag & Drop
1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Click "Add New Project"
3. Upload this folder
4. Click Deploy
5. Done — share the URL with the group

### Option B: GitHub
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import from GitHub
3. Select the repo → Deploy
4. Done

## How It Works

- **Live Scores**: The app polls ESPN's public API every 30 seconds during games
- **Player Matching**: It matches ESPN box score data to your drafted players automatically
- **The Tin**: Real-time feed of every basket scored by your pool's players
- **Moments**: Maching (25+ pt game) and Rinsed (under 5 pts for a high-PPG player) auto-detected
- **Graveyard**: When a team is eliminated, their players get "Silence Now" treatment

## Features
- 🏆 Live Leaderboard with $ amounts
- 📋 Draft Recap (8 rounds, 11 drafters)
- 👥 Team Rosters with ESPN headshots/logos
- 📊 Player Rankings (PPG, Highest Game, Most 3s, Tourney Pts)
- 📺 Live/Upcoming/Completed Games
- ⚔️ Head to Head comparisons
- 🔥 Moments (Maching / Rinsed)
- 🪦 The Graveyard (Silence Now)
- 👻 Ghost of Tib

## Updating

To add Edel's final Round 8 pick:
1. Open `app/data.js`
2. Find Edel's picks array
3. Add the player at the end
4. Redeploy (Vercel auto-deploys on push)
