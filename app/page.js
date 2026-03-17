'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DRAFTERS, PICKS, SEED6_TEAMS, SEED11_TEAMS, BRACKET, teamLogo, playerImg } from './data';

const K = { bg:'#060610',card:'#0c0d18',alt:'#111222',bdr:'#1c1d32',acc:'#00e676',hot:'#ff2d55',gold:'#ffab00',blue:'#448aff',txt:'#eaeaf2',dim:'#555580',dimmer:'#2a2a42' };
const sC = s => s<=1?K.gold:s<=2?'#aab':s<=3?'#cd7f32':s<=4?K.acc:s<=6?K.blue:s<=8?'#b388ff':'#ff8a65';

// ===== SMALL COMPONENTS =====
function Img({ src, alt, style, children }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return children || null;
  return <img src={src} alt={alt||''} style={{ ...style, display:'block' }} onError={() => setOk(false)} />;
}

function Avatar({ name, team, seed, size = 48 }) {
  const c = sC(seed);
  return (
    <div style={{ width:size, height:size, borderRadius:size>40?12:8, overflow:'hidden', background:K.alt, flexShrink:0, position:'relative', border:`2px solid ${c}33` }}>
      <Img src={playerImg(name)} style={{ width:size, height:size, objectFit:'cover', objectPosition:'top center' }}>
        <div style={{ width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.32, fontWeight:700, color:c, background:`${c}12` }}>{name.split(' ').map(w=>w[0]).join('')}</div>
      </Img>
      <div style={{ position:'absolute', bottom:-1, right:-1, width:size*.36, height:size*.36, borderRadius:3, overflow:'hidden', background:K.bg, padding:1 }}>
        <Img src={teamLogo(team)} style={{ width:'100%', height:'100%', objectFit:'contain' }}><div/></Img>
      </div>
    </div>
  );
}

function TeamBadge({ team, size = 18 }) {
  return <Img src={teamLogo(team)} style={{ width:size, height:size, objectFit:'contain', flexShrink:0 }}><div style={{ width:size, height:size, borderRadius:3, background:K.alt, fontSize:size*.5, display:'flex', alignItems:'center', justifyContent:'center', color:K.dim, fontWeight:700 }}>{(team||'').slice(0,2)}</div></Img>;
}

function SeedTag({ team }) {
  const is6 = SEED6_TEAMS.includes(team), is11 = SEED11_TEAMS.includes(team);
  if (!is6 && !is11) return null;
  return <span style={{ fontSize:9, fontWeight:800, color:is6?K.blue:K.hot, background:is6?`${K.blue}18`:`${K.hot}14`, padding:'2px 6px', borderRadius:4 }}>{is6?'6 SEED':'11 SEED'}</span>;
}

function AnimNum({ value, size = 24, color = K.txt }) {
  const [d, setD] = useState(value);
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const s = prev.current, e = value; prev.current = value;
    if (s === e) return;
    setFlash(true); setTimeout(() => setFlash(false), 400);
    const t0 = performance.now(), dur = 500;
    const go = ts => { const p = Math.min((ts - t0) / dur, 1); setD(Math.round(s + (e - s) * p)); if (p < 1) requestAnimationFrame(go); };
    requestAnimationFrame(go);
  }, [value]);
  return <span style={{ fontSize:size, fontWeight:900, fontFamily:"'Anybody',sans-serif", color:flash?K.acc:color, transition:'color .3s', textShadow:flash?`0 0 20px ${K.acc}88`:'none' }}>{d}</span>;
}

// ===== MAIN APP =====
export default function Page() {
  const [tab, setTab] = useState('leaderboard');
  const [sel, setSel] = useState('Edel');
  const [h2h, setH2h] = useState([null, null]);
  const [data, setData] = useState(PICKS);
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [completedGames, setCompletedGames] = useState([]);
  const [tourneyProgress, setTourneyProgress] = useState({ gamesPlayed: 0, totalGames: 67, pct: 0 });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tin, setTin] = useState([]); // The Tin feed
  const [moments, setMoments] = useState([]);

  // Poll scores every 30s
  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch('/api/scores');
        if (!res.ok) return;
        const json = await res.json();
        if (json.playerScores) {
          setData(prev => {
            const next = { ...prev };
            for (const [key, score] of Object.entries(json.playerScores)) {
              const [drafter, idx] = key.split(':');
              if (next[drafter]?.[parseInt(idx)]) {
                const p = { ...next[drafter][parseInt(idx)] };
                const oldPts = p.pts;
                p.pts = score.totalPts;
                p.games = score.games;
                p.gamesPlayed = score.games.length;
                next[drafter] = [...next[drafter]];
                next[drafter][parseInt(idx)] = p;

                // Add to Tin if points changed
                if (score.totalPts > oldPts) {
                  const diff = score.totalPts - oldPts;
                  const latestGame = score.games[score.games.length - 1];
                  setTin(prev => [{
                    id: Date.now() + Math.random(),
                    player: p.name, team: p.team, drafter,
                    pts: diff, type: diff >= 3 ? '3PT FG' : '2PT FG',
                    total: score.totalPts,
                    opponent: latestGame?.opponent || '',
                    ts: Date.now(),
                  }, ...prev].slice(0, 30));

                  // Check for Maching (25+ pts in a game)
                  for (const g of score.games) {
                    if (g.pts >= 25 && g.status === 'STATUS_FINAL') {
                      setMoments(prev => {
                        if (prev.some(m => m.gameId === g.gameId && m.player === p.name)) return prev;
                        return [{
                          id: Date.now(), type: 'maching', player: p.name, team: p.team,
                          drafter, pts: g.pts, opponent: g.opponent, gameId: g.gameId, ts: Date.now(),
                        }, ...prev];
                      });
                    }
                    // Check for Rinsed (under 5 pts in completed game)
                    if (g.pts < 5 && g.status === 'STATUS_FINAL' && p.ppg >= 15) {
                      setMoments(prev => {
                        if (prev.some(m => m.gameId === g.gameId && m.player === p.name && m.type === 'rinsed')) return prev;
                        return [{
                          id: Date.now(), type: 'rinsed', player: p.name, team: p.team,
                          drafter, pts: g.pts, opponent: g.opponent, gameId: g.gameId, ts: Date.now(), ppg: p.ppg,
                        }, ...prev];
                      });
                    }
                  }
                }
              }
            }
            return next;
          });
        }
        if (json.liveGames) setLiveGames(json.liveGames);
        if (json.upcomingGames) setUpcomingGames(json.upcomingGames);
        if (json.completedGames) setCompletedGames(json.completedGames);
        if (json.tournament) setTourneyProgress(json.tournament);
        setLastUpdated(json.lastUpdated);
      } catch (e) { console.error('Score fetch failed:', e); }
    };
    fetchScores();
    const interval = setInterval(fetchScores, 30000);
    return () => clearInterval(interval);
  }, []);

  // Leaderboard
  const board = useMemo(() => {
    return DRAFTERS.map(d => {
      const ps = data[d] || [];
      const pts = ps.reduce((s, p) => s + p.pts, 0);
      const act = ps.filter(p => !p.eliminated).length;
      const ppg = ps.reduce((s, p) => s + p.ppg, 0);
      const hasLive = liveGames.some(g => ps.some(p => !p.eliminated && (p.team === g.home.name || p.team === g.away.name)));
      return { d, pts, act, tot: ps.length, ppg, hasLive };
    }).sort((a, b) => b.pts - a.pts || b.ppg - a.ppg);
  }, [data, liveGames]);

  const dead = useMemo(() =>
    DRAFTERS.flatMap(d => (data[d] || []).filter(p => p.eliminated).map(p => ({ ...p, drafter: d })))
  , [data]);

  const lead = board[0];

  // Ticker content - cycles through different info
  const tickerItems = useMemo(() => {
    const items = [];
    // Current leaderboard
    board.forEach((r, i) => items.push({ type:'rank', text:`#${i+1} ${r.d} — ${r.pts}pts`, color: i===0?K.gold:K.txt }));
    // All players
    DRAFTERS.forEach(d => (data[d]||[]).forEach(p => {
      if (!p.eliminated) items.push({ type:'player', text:`${p.name} (${d}) — ${p.team} — ${p.ppg}ppg`, color: sC(p.seed) });
    }));
    // Top performers
    const allP = DRAFTERS.flatMap(d => (data[d]||[]).map(p => ({...p, drafter:d})));
    allP.sort((a,b) => b.pts - a.pts);
    allP.slice(0,5).forEach(p => {
      if (p.pts > 0) items.push({ type:'top', text:`🔥 ${p.name} — ${p.pts} tourney pts (${p.drafter})`, color: K.gold });
    });
    return items;
  }, [board, data]);

  const tabs = [
    { id:'leaderboard', l:'Leaderboard', i:'🏆' },
    { id:'recap', l:'Draft Recap', i:'📋' },
    { id:'rosters', l:'Rosters', i:'👥' },
    { id:'players', l:'Top Players', i:'📊' },
    { id:'games', l:'Games', i:'📺' },
    { id:'h2h', l:'Head to Head', i:'⚔️' },
    { id:'moments', l:'Moments', i:'🔥' },
    { id:'graveyard', l:'The Graveyard', i:'🪦' },
  ];

  return (
    <div style={{ minHeight:'100vh' }}>
      {/* HEADER */}
      <div style={{ background:`linear-gradient(180deg,${K.card},${K.bg})`, borderBottom:`1px solid ${K.bdr}`, padding:'18px 0 0' }}>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 20px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:14 }}>
            <div>
              <h1 style={{ fontFamily:"'Anybody',sans-serif", fontSize:'clamp(30px,5vw,46px)', fontWeight:900, letterSpacing:-1, background:`linear-gradient(135deg,${K.acc},${K.gold})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 }}>THE POOL</h1>
              <div style={{ fontSize:11, color:K.dim, letterSpacing:4, textTransform:'uppercase', marginTop:2 }}>March Madness 2026</div>
            </div>
            <div style={{ display:'flex', gap:20 }}>
              <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:K.dim, letterSpacing:2 }}>LEADER</div><div style={{ fontSize:17, fontWeight:700, color:K.acc }}>{lead.d}</div></div>
              {lastUpdated && <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:K.dim, letterSpacing:2 }}>UPDATED</div><div style={{ fontSize:12, color:K.dim }}>{new Date(lastUpdated).toLocaleTimeString()}</div></div>}
            </div>
          </div>

          {/* Progress bars */}
          <div style={{ display:'flex', gap:12, marginBottom:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:K.dim, marginBottom:3 }}>
                <span>Round of 64</span>
                <span>{completedGames.length}/32</span>
              </div>
              <div style={{ height:5, background:K.bdr, borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', background:`linear-gradient(90deg,${K.acc},${K.gold})`, borderRadius:3, transition:'width .6s', width:`${Math.min((completedGames.length/32)*100,100)}%` }}/>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:K.dim, marginBottom:3 }}>
                <span>Tournament</span>
                <span>{tourneyProgress.pct}%</span>
              </div>
              <div style={{ height:5, background:K.bdr, borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', background:`linear-gradient(90deg,${K.gold},${K.hot})`, borderRadius:3, transition:'width .6s', width:`${tourneyProgress.pct}%` }}/>
              </div>
            </div>
          </div>

          {/* THE TIN - ticker */}
          <div style={{ overflow:'hidden', borderRadius:8, background:K.bg, border:`1px solid ${K.bdr}`, marginBottom:12, padding:'6px 0' }}>
            <div style={{ display:'flex', gap:28, animation:'ticker 60s linear infinite', whiteSpace:'nowrap' }}>
              {[...tickerItems,...tickerItems].map((item, i) =>
                <span key={i} style={{ fontSize:12, color:item.color, fontWeight:item.type==='top'?700:400 }}>{item.text} <span style={{ color:K.dimmer }}>|</span> </span>
              )}
            </div>
          </div>

          {/* THE TIN - Live feed */}
          {tin.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:K.dim, letterSpacing:2, marginBottom:4 }}>THE TIN</div>
              <div style={{ background:K.card, border:`1px solid ${K.bdr}`, borderRadius:10, maxHeight:150, overflow:'auto' }}>
                {tin.slice(0, 8).map((ev, i) =>
                  <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 14px', borderBottom:`1px solid ${K.bdr}22`, animation: i===0?'slideInLeft .3s ease-out':'none', background:i===0?`${K.acc}06`:'transparent' }}>
                    {i===0 && <div style={{ width:7, height:7, borderRadius:'50%', background:K.acc, animation:'liveDot 1.5s infinite', flexShrink:0 }}/>}
                    {i>0 && <div style={{ width:7, flexShrink:0 }}/>}
                    <TeamBadge team={ev.team} size={14}/>
                    <span style={{ fontWeight:700, fontSize:13 }}>{ev.player}</span>
                    <span style={{ color:ev.type==='3PT FG'?K.gold:K.txt, fontWeight:700, fontSize:12 }}>+{ev.pts} ({ev.type})</span>
                    <span style={{ color:K.dim, fontSize:11 }}>→ {ev.total} total</span>
                    <span style={{ marginLeft:'auto', fontSize:11, color:K.acc, fontWeight:600 }}>{ev.drafter}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TABS */}
          <div style={{ display:'flex', gap:1, overflowX:'auto' }}>
            {tabs.map(t => <button key={t.id} className="tab" onClick={() => setTab(t.id)} style={{ padding:'9px 14px', fontSize:12, fontWeight:tab===t.id?700:500, color:tab===t.id?K.acc:K.dim, background:tab===t.id?`${K.acc}0a`:'transparent', borderBottom:tab===t.id?`2px solid ${K.acc}`:'2px solid transparent', borderRadius:'6px 6px 0 0' }}>{t.i} {t.l}</button>)}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'20px 20px 60px' }}>

        {/* ===== LEADERBOARD ===== */}
        {tab === 'leaderboard' && <div style={{ animation:'slideIn .35s ease-out' }}>
          {board.map((r, i) => {
            const isL = i === 0;
            const earn = isL ? board.slice(1).reduce((s, x) => s + (lead.pts - x.pts), 0) : 0;
            const owes = r.pts - lead.pts;
            return (
              <div key={r.d} className="hov" onClick={() => { if(r.d!=='Ghost of Tib'){setSel(r.d);setTab('rosters');} }} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', marginBottom:5, background:r.d==='Ghost of Tib'?`${K.dimmer}44`:isL?`linear-gradient(90deg,${K.acc}08,transparent)`:K.card, border:`1px solid ${isL?K.acc+'33':K.bdr}`, borderRadius:12, animation:`slideIn .3s ease-out ${i*.035}s both`, opacity:r.d==='Ghost of Tib'?.5:1 }}>
                <div style={{ fontSize:22, fontWeight:900, fontFamily:"'Anybody',sans-serif", color:i===0?K.gold:i===1?'#999':i===2?'#cd7f32':K.dim, width:32, textAlign:'center' }}>{i+1}</div>
                {r.d === 'Ghost of Tib' ? (
                  <div style={{ fontSize:28, animation:'ghostFloat 3s ease-in-out infinite' }}>👻</div>
                ) : (
                  <div style={{ display:'flex' }}>
                    {(data[r.d]||[]).slice(0,3).map((p,j) => (
                      <div key={p.name} style={{ width:28, height:28, borderRadius:6, overflow:'hidden', border:`2px solid ${K.bg}`, marginLeft:j>0?-8:0, zIndex:3-j }}>
                        <Img src={playerImg(p.name)} style={{ width:28, height:28, objectFit:'cover', objectPosition:'top' }}>
                          <div style={{ width:28, height:28, background:K.alt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:K.dim }}>{p.name[0]}</div>
                        </Img>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:17, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                    {r.d}
                    {r.hasLive && <div style={{ width:8, height:8, borderRadius:'50%', background:K.acc, animation:'liveDot 1.5s infinite' }}/>}
                  </div>
                  <div style={{ fontSize:11, color:K.dim }}>{r.act}/{r.tot} active · {r.ppg.toFixed(1)} combined ppg</div>
                </div>
                <div style={{ textAlign:'right', minWidth:70 }}>
                  <div><AnimNum value={r.pts} size={22}/></div>
                  <div style={{ fontSize:10, color:K.dim }}>pts</div>
                </div>
                <div style={{ textAlign:'right', minWidth:70 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:isL?K.acc:K.hot }}>{isL ? `+$${earn}` : `${owes === 0 ? '$0' : `-$${Math.abs(owes)}`}`}</div>
                  <div style={{ fontSize:9, color:K.dim }}>{isL ? 'earns' : 'owes'}</div>
                </div>
                <div style={{ width:54 }}>
                  <div style={{ fontSize:8, color:K.dim, textAlign:'center', marginBottom:2 }}>{r.tot - r.act} out</div>
                  <div style={{ height:5, background:K.bdr, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${r.tot===0?100:((r.tot - r.act) / r.tot) * 100}%`, background:r.act===0?K.hot:`${K.hot}aa`, borderRadius:3, transition:'width .6s' }}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}

        {/* ===== DRAFT RECAP ===== */}
        {tab === 'recap' && <div style={{ animation:'slideIn .35s ease-out', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 3px', fontSize:12 }}>
            <thead><tr>
              <th style={{ ...th_(), position:'sticky', left:0, zIndex:2, background:K.bg }}>Rd</th>
              {DRAFTERS.filter(d=>d!=='Ghost of Tib').map(d => <th key={d} style={th_()}>{d}</th>)}
            </tr></thead>
            <tbody>
              {[0,1,2,3,4,5,6,7].map(r => <tr key={r}>
                <td style={{ ...td_(), position:'sticky', left:0, background:K.bg, fontWeight:700, color:K.dim }}>R{r+1}</td>
                {DRAFTERS.filter(d=>d!=='Ghost of Tib').map(d => {
                  const p = (data[d]||[])[r];
                  if (!p) return <td key={d+r} style={{ ...td_(), color:K.dimmer }}>—</td>;
                  const is6 = SEED6_TEAMS.includes(p.team), is11 = SEED11_TEAMS.includes(p.team);
                  return <td key={d+r} style={{ ...td_(), background:is6?`${K.blue}0c`:is11?`${K.hot}08`:K.card, borderLeft:is6?`3px solid ${K.blue}`:is11?`3px solid ${K.hot}`:'3px solid transparent' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:130 }}>
                      <Avatar name={p.name} team={p.team} seed={p.seed} size={30}/>
                      <div style={{ textAlign:'left' }}>
                        <div style={{ fontWeight:700, fontSize:11, whiteSpace:'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize:10, color:K.dim }}>{p.team} · {p.ppg}ppg</div>
                      </div>
                    </div>
                  </td>;
                })}
              </tr>)}
            </tbody>
          </table>
          <div style={{ display:'flex', gap:16, marginTop:14, fontSize:11, color:K.dim }}>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:12, height:12, background:`${K.blue}18`, border:`2px solid ${K.blue}`, borderRadius:2 }}/> 6 Seed</span>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:12, height:12, background:`${K.hot}14`, border:`2px solid ${K.hot}`, borderRadius:2 }}/> 11 Seed</span>
          </div>
        </div>}

        {/* ===== ROSTERS ===== */}
        {tab === 'rosters' && <div style={{ animation:'slideIn .35s ease-out' }}>
          <div style={{ display:'flex', gap:5, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
            {DRAFTERS.filter(d=>d!=='Ghost of Tib').map(d => <button key={d} className="tab" onClick={() => setSel(d)} style={{ padding:'8px 14px', fontSize:12, fontWeight:sel===d?700:500, color:sel===d?'#000':K.txt, background:sel===d?K.acc:K.card, border:`1px solid ${sel===d?K.acc:K.bdr}`, borderRadius:8, whiteSpace:'nowrap' }}>{d}</button>)}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
            <h2 style={{ fontFamily:"'Anybody',sans-serif", fontSize:26, fontWeight:900 }}>{sel}</h2>
            <span style={{ fontSize:12, color:K.dim }}>{(data[sel]||[]).length} players · {(data[sel]||[]).filter(p=>!p.eliminated).length} active · {(data[sel]||[]).reduce((s,p)=>s+p.ppg,0).toFixed(1)} ppg</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:8 }}>
            {(data[sel]||[]).map((p, i) => (
              <div key={p.name} className="hov" style={{ display:'flex', alignItems:'center', gap:14, padding:14, background:K.card, border:`1px solid ${K.bdr}`, borderRadius:12, position:'relative', overflow:'hidden', animation:`slideIn .3s ease-out ${i*.06}s both`, borderLeft:SEED6_TEAMS.includes(p.team)?`3px solid ${K.blue}`:SEED11_TEAMS.includes(p.team)?`3px solid ${K.hot}`:'3px solid transparent' }}>
                {p.eliminated && <div style={{ position:'absolute', inset:0, background:'rgba(6,6,16,.82)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:3, backdropFilter:'blur(3px)', animation:'silenceIn .4s ease-out' }}>
                  <div style={{ fontFamily:"'Anybody',sans-serif", fontSize:18, fontWeight:900, color:K.dim, letterSpacing:4 }}>SILENCE NOW</div>
                  <div style={{ fontSize:11, color:K.dimmer, marginTop:4 }}>{p.name} · {p.team} eliminated</div>
                </div>}
                <div style={{ fontSize:11, fontWeight:700, color:K.dim, width:22, textAlign:'center', flexShrink:0 }}>R{i+1}</div>
                <Avatar name={p.name} team={p.team} seed={p.seed} size={54}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <span style={{ fontSize:16, fontWeight:700 }}>{p.name}</span>
                    <SeedTag team={p.team}/>
                  </div>
                  <div style={{ fontSize:12, color:K.dim, display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
                    <TeamBadge team={p.team} size={15}/>{p.team} · #{p.seed} · {p.pos}
                  </div>
                  {p.pts > 0 && <div style={{ fontSize:11, color:K.acc, marginTop:3, fontWeight:600 }}>Tournament: {p.pts} pts in {p.gamesPlayed} game{p.gamesPlayed!==1?'s':''}</div>}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:22, fontWeight:900, fontFamily:"'Anybody',sans-serif", color:sC(p.seed) }}>{p.ppg}</div>
                  <div style={{ fontSize:9, color:K.dim }}>PPG</div>
                  <div style={{ fontSize:10, color:K.dim, marginTop:3 }}>Hi: {p.hi}pts · {p.threes} 3s</div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* ===== TOP PLAYERS ===== */}
        {tab === 'players' && <PlayerTab data={data}/>}

        {/* ===== GAMES ===== */}
        {tab === 'games' && <GamesTab liveGames={liveGames} upcomingGames={upcomingGames} completedGames={completedGames} data={data}/>}

        {/* ===== HEAD TO HEAD ===== */}
        {tab === 'h2h' && <H2HTab data={data} h2h={h2h} setH2h={setH2h}/>}

        {/* ===== MOMENTS ===== */}
        {tab === 'moments' && <div style={{ animation:'slideIn .35s ease-out' }}>
          {moments.length === 0 ? (
            <div style={{ textAlign:'center', padding:'50px 20px' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>🔥</div>
              <div style={{ fontFamily:"'Anybody',sans-serif", fontSize:24, fontWeight:900, marginBottom:8 }}>Moments drop when the games start</div>
              <div style={{ fontSize:13, color:K.dim, maxWidth:420, margin:'0 auto', lineHeight:1.7, marginBottom:32 }}>Every huge performance and every disaster gets stamped here. First games tip March 17.</div>
              <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
                <div style={{ background:K.card, border:`1px solid ${K.acc}33`, borderRadius:14, padding:'20px 28px', minWidth:160 }}>
                  <div style={{ fontFamily:"'Anybody',sans-serif", fontSize:22, fontWeight:900, color:K.acc }}>MACHING</div>
                  <div style={{ fontSize:11, color:K.dim, marginTop:6 }}>A massive game.<br/>The kind you text about.</div>
                </div>
                <div style={{ background:K.card, border:`1px solid ${K.hot}33`, borderRadius:14, padding:'20px 28px', minWidth:160 }}>
                  <div style={{ fontFamily:"'Anybody',sans-serif", fontSize:22, fontWeight:900, color:K.hot }}>RINSED</div>
                  <div style={{ fontSize:11, color:K.dim, marginTop:6 }}>Something went wrong.<br/>Very, very wrong.</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display:'grid', gap:10 }}>
              {moments.map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:14, padding:16, background:K.card, border:`1px solid ${m.type==='maching'?K.acc:K.hot}33`, borderRadius:12, animation:'slideIn .3s ease-out' }}>
                  <div style={{ fontFamily:"'Anybody',sans-serif", fontSize:16, fontWeight:900, color:m.type==='maching'?K.acc:K.hot, minWidth:80 }}>{m.type==='maching'?'MACHING':'RINSED'}</div>
                  <Avatar name={m.player} team={m.team} seed={0} size={40}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700 }}>{m.player}</div>
                    <div style={{ fontSize:12, color:K.dim }}>{m.pts} pts vs {m.opponent} — {m.drafter}'s pick</div>
                    {m.type === 'rinsed' && <div style={{ fontSize:11, color:K.hot }}>Season avg: {m.ppg} ppg</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}

        {/* ===== THE GRAVEYARD ===== */}
        {tab === 'graveyard' && <div style={{ animation:'slideIn .35s ease-out' }}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ fontFamily:"'Anybody',sans-serif", fontSize:'clamp(28px,5vw,40px)', fontWeight:900, color:K.dim, letterSpacing:2 }}>THE GRAVEYARD</div>
            <div style={{ fontSize:13, color:K.dimmer, marginTop:4 }}>Players eliminated from the tournament</div>
          </div>
          {dead.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:48, marginBottom:12, animation:'ghostFloat 3s ease-in-out infinite' }}>🪦</div>
              <div style={{ fontFamily:"'Anybody',sans-serif", fontSize:20, fontWeight:900, color:K.dimmer }}>Empty... for now</div>
              <div style={{ fontSize:13, color:K.dimmer, marginTop:6 }}>The tournament starts March 17.</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
              {dead.map((p, i) => (
                <div key={p.name} style={{ background:K.card, border:`1px solid ${K.bdr}`, borderRadius:12, position:'relative', overflow:'hidden', animation:`slideIn .3s ease-out ${i*.05}s both` }}>
                  <div style={{ padding:16, opacity:.25, filter:'grayscale(1)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <Avatar name={p.name} team={p.team} seed={p.seed} size={48}/>
                      <div>
                        <div style={{ fontSize:15, fontWeight:700, textDecoration:'line-through' }}>{p.name}</div>
                        <div style={{ fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                          <TeamBadge team={p.team} size={12}/>{p.team} · #{p.seed}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(6,6,16,.65)', backdropFilter:'blur(2px)', animation:'silenceIn .5s ease-out' }}>
                    <div style={{ fontFamily:"'Anybody',sans-serif", fontSize:22, fontWeight:900, color:K.dim, letterSpacing:5 }}>SILENCE NOW</div>
                    <div style={{ fontSize:11, color:K.dimmer, marginTop:4 }}>{p.name} · {p.team}</div>
                    <div style={{ fontSize:10, color:K.dimmer, marginTop:4 }}>Drafted by <span style={{ color:K.dim }}>{p.drafter}</span> · {p.pts} pts</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}
      </div>
    </div>
  );
}

// ===== PLAYER TAB =====
function PlayerTab({ data }) {
  const all = DRAFTERS.filter(d=>d!=='Ghost of Tib').flatMap(d => (data[d]||[]).map(p => ({ ...p, drafter: d })));
  const [sort, setSort] = useState('ppg');
  const sorted = [...all].sort((a,b) => sort==='ppg'?b.ppg-a.ppg:sort==='hi'?b.hi-a.hi:sort==='threes'?b.threes-a.threes:b.pts-a.pts);

  return <div style={{ animation:'slideIn .35s ease-out' }}>
    <div style={{ display:'flex', gap:5, marginBottom:14 }}>
      {[['ppg','Season PPG'],['hi','Highest Game'],['threes','Most 3s'],['pts','Tourney Pts']].map(([k,l]) =>
        <button key={k} className="tab" onClick={() => setSort(k)} style={{ padding:'8px 14px', fontSize:12, fontWeight:sort===k?700:400, color:sort===k?'#000':K.txt, background:sort===k?K.acc:K.card, border:`1px solid ${sort===k?K.acc:K.bdr}`, borderRadius:8 }}>{l}</button>)}
    </div>
    {sorted.map((p, i) => {
      const val = sort==='ppg'?p.ppg:sort==='hi'?p.hi:sort==='threes'?p.threes:p.pts;
      const unit = sort==='threes'?' 3s':sort==='ppg'?' ppg':' pts';
      return <div key={p.name} className="hov" style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', marginBottom:3, background:i<3?`${K.gold}06`:K.card, border:`1px solid ${i<3?K.gold+'22':K.bdr}`, borderRadius:10, animation:`slideIn .2s ease-out ${Math.min(i*.02,.4)}s both` }}>
        <div style={{ fontSize:15, fontWeight:900, fontFamily:"'Anybody',sans-serif", color:i===0?K.gold:i===1?'#999':i===2?'#cd7f32':K.dim, width:26, textAlign:'center' }}>{i+1}</div>
        <Avatar name={p.name} team={p.team} seed={p.seed} size={36}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>{p.name}<SeedTag team={p.team}/></div>
          <div style={{ fontSize:11, color:K.dim }}>{p.team} · {p.pos} · <span style={{ color:K.acc }}>{p.drafter}</span></div>
        </div>
        <div style={{ fontSize:18, fontWeight:900, fontFamily:"'Anybody',sans-serif", color:i<3?K.gold:K.txt }}>{val}<span style={{ fontSize:11, color:K.dim }}>{unit}</span></div>
      </div>;
    })}
  </div>;
}

// ===== GAMES TAB =====
function GamesTab({ liveGames, upcomingGames, completedGames, data }) {
  const allPlayers = DRAFTERS.filter(d=>d!=='Ghost of Tib').flatMap(d => (data[d]||[]).map(p => ({ ...p, drafter: d })));
  const getPoolPlayers = (teamName) => allPlayers.filter(p => p.team === teamName || teamName?.includes(p.team));

  return <div style={{ animation:'slideIn .35s ease-out' }}>
    {liveGames.length > 0 && <>
      <h3 style={{ fontSize:16, fontWeight:700, color:K.acc, marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:K.acc, animation:'liveDot 1.5s infinite' }}/> Live Now
      </h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10, marginBottom:24 }}>
        {liveGames.map(g => <GameCard key={g.id} game={g} poolPlayers={[...getPoolPlayers(g.home.name),...getPoolPlayers(g.away.name)]} live/>)}
      </div>
    </>}

    <h3 style={{ fontSize:16, fontWeight:700, marginBottom:10 }}>Upcoming</h3>
    {upcomingGames.length === 0 && <div style={{ color:K.dim, padding:20 }}>No upcoming games scheduled</div>}
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10, marginBottom:24 }}>
      {upcomingGames.map(g => <GameCard key={g.id} game={g} poolPlayers={[...getPoolPlayers(g.home.name),...getPoolPlayers(g.away.name)]}/>)}
    </div>

    {completedGames.length > 0 && <>
      <h3 style={{ fontSize:16, fontWeight:700, marginBottom:10 }}>Completed</h3>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10 }}>
        {completedGames.map(g => <GameCard key={g.id} game={g} poolPlayers={[...getPoolPlayers(g.home.name),...getPoolPlayers(g.away.name)]} completed/>)}
      </div>
    </>}
  </div>;
}

function GameCard({ game, poolPlayers = [], live, completed }) {
  return (
    <div style={{ background:K.card, border:`1px solid ${live?K.acc+'44':K.bdr}`, borderRadius:12, padding:14, animation:live?'glow 3s infinite':'none' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Img src={game.away.logo} style={{ width:28, height:28, objectFit:'contain' }}><div/></Img>
          <span style={{ fontWeight:700, fontSize:14 }}>{game.away.abbr}</span>
          <span style={{ fontWeight:900, fontSize:18 }}>{game.away.score}</span>
        </div>
        <div style={{ fontSize:11, color:live?K.acc:K.dim, fontWeight:live?700:400 }}>
          {live ? game.displayClock || 'LIVE' : completed ? 'FINAL' : new Date(game.startTime).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontWeight:900, fontSize:18 }}>{game.home.score}</span>
          <span style={{ fontWeight:700, fontSize:14 }}>{game.home.abbr}</span>
          <Img src={game.home.logo} style={{ width:28, height:28, objectFit:'contain' }}><div/></Img>
        </div>
      </div>
      {poolPlayers.length > 0 && (
        <div style={{ borderTop:`1px solid ${K.bdr}`, paddingTop:8 }}>
          <div style={{ fontSize:10, color:K.dim, marginBottom:4 }}>YOUR PLAYERS</div>
          {poolPlayers.map(p => (
            <div key={p.name} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, padding:'2px 0' }}>
              <span style={{ fontWeight:600 }}>{p.name}</span>
              <span style={{ color:K.dim }}>({p.drafter})</span>
              {p.pts > 0 && <span style={{ color:K.acc, fontWeight:700, marginLeft:'auto' }}>{p.pts} pts</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== H2H TAB =====
function H2HTab({ data, h2h, setH2h }) {
  return <div style={{ animation:'slideIn .35s ease-out' }}>
    <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
      {[0,1].map(s => <div key={s} style={{ flex:1, minWidth:280 }}>
        <div style={{ fontSize:11, color:K.dim, marginBottom:6, letterSpacing:2 }}>DRAFTER {s+1}</div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14 }}>
          {DRAFTERS.filter(d=>d!=='Ghost of Tib').map(d => <button key={d} className="tab" onClick={() => { const n=[...h2h]; n[s]=d; setH2h(n); }} style={{ padding:'6px 11px', fontSize:11, fontWeight:h2h[s]===d?700:400, color:h2h[s]===d?'#000':K.txt, background:h2h[s]===d?K.acc:K.card, border:`1px solid ${h2h[s]===d?K.acc:K.bdr}`, borderRadius:6 }}>{d}</button>)}
        </div>
        {h2h[s] && <div style={{ background:K.card, border:`1px solid ${K.bdr}`, borderRadius:12, padding:16 }}>
          <div style={{ fontSize:20, fontWeight:900, fontFamily:"'Anybody',sans-serif", marginBottom:8 }}>{h2h[s]}</div>
          {(data[h2h[s]]||[]).map(p => <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderTop:`1px solid ${K.bdr}22` }}>
            <Avatar name={p.name} team={p.team} seed={p.seed} size={30}/>
            <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>{p.name}</div><div style={{ fontSize:10, color:K.dim }}>{p.team}</div></div>
            <div style={{ fontSize:13, fontWeight:700, color:sC(p.seed) }}>{p.pts > 0 ? `${p.pts} pts` : `${p.ppg}ppg`}</div>
          </div>)}
        </div>}
      </div>)}
    </div>
    {h2h[0] && h2h[1] && <div style={{ marginTop:20, padding:16, background:K.card, border:`1px solid ${K.bdr}`, borderRadius:12, textAlign:'center' }}>
      {(() => {
        const a = (data[h2h[0]]||[]).reduce((s,p) => s+p.pts, 0);
        const b = (data[h2h[1]]||[]).reduce((s,p) => s+p.pts, 0);
        const d = Math.abs(a-b);
        const w = a>b?h2h[0]:a<b?h2h[1]:null;
        return <>
          <div style={{ fontSize:13, color:K.dim }}>Point Difference</div>
          <div style={{ fontSize:30, fontWeight:900, fontFamily:"'Anybody',sans-serif", color:d===0?K.dim:K.acc }}>{d===0?'TIED':`${w} +${d}`}</div>
          {d>0 && <div style={{ fontSize:15, fontWeight:700, color:K.hot, marginTop:2 }}>${d}</div>}
        </>;
      })()}
    </div>}
  </div>;
}

function th_() { return { padding:'8px 6px', textAlign:'center', fontWeight:700, fontSize:11, color:K.dim, textTransform:'uppercase', letterSpacing:1, whiteSpace:'nowrap', borderBottom:`1px solid ${K.bdr}` }; }
function td_() { return { padding:'8px 6px', textAlign:'center', borderBottom:`1px solid ${K.bdr}11`, whiteSpace:'nowrap' }; }
