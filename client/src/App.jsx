import { useEffect, useMemo, useState } from "react";
import { Bot, Crown, LogOut, Play, RotateCcw, Shield, Swords, Star, Trash2, Trophy, UserRound, Users, WandSparkles, X, Zap } from "lucide-react";
import { demoPlayers } from "./data/players";
import AuthModal from "./components/AuthModal";
import RoomLobby from "./components/RoomLobby";
import AdminPanel from "./components/AdminPanel";

// Vite forwards /api to the Express server; use VITE_API_URL only for a deployed API.
const API_URL = import.meta.env.VITE_API_URL || "/api";
const positions = [
  [50, 88, "GK"], [20, 70, "LB"], [40, 73, "CB"], [60, 73, "CB"], [80, 70, "RB"],
  [30, 48, "CM"], [50, 42, "CAM"], [70, 48, "CM"], [25, 22, "LW"], [50, 16, "ST"], [75, 22, "RW"],
];
const opponentPositions = positions.map(([x, y, role]) => [x, 100 - y, role]);
const playerEnergy = (player) => Math.min(100, Math.round(((player.stats?.pace || 75) + (player.stats?.dribbling || 75)) / 2));
const preferredSlots = {
  MBAPP: [50, 16, "ST"], HAALAND: [75, 22, "RW"], VIN: [25, 22, "LW"],
  BELLINGHAM: [50, 42, "CAM"], RODRI: [50, 57, "CDM"], SALIBA: [42, 73, "CB"], COURTOIS: [50, 88, "GK"],
};
const slotFor = (player, side = "home") => {
  const key = Object.keys(preferredSlots).find((name) => (player.shortName || player.name).toUpperCase().includes(name));
  const [x, y, role] = preferredSlots[key] || [50, 50, "CM"];
  return [x, side === "home" ? y : 100 - y, role];
};

const ratingTone = (rating) => rating >= 91 ? "text-amber-300" : rating >= 88 ? "text-cyan-300" : "text-emerald-300";

function App() {
  const [players, setPlayers] = useState(demoPlayers);
  const [lineup, setLineup] = useState([]);
  const [opponentLineup, setOpponentLineup] = useState(() => demoPlayers.map((player) => { const [x, y, fieldPosition] = slotFor(player, "away"); return { player, x, y, fieldPosition, energy: playerEnergy(player) }; }));
  const [activeSide, setActiveSide] = useState("home");
  const [selected, setSelected] = useState(null);
  const [game, setGame] = useState({ active: false, id: null, turn: 0, home: 0, away: 0, message: "Choose your squad to begin." });
  const [battle, setBattle] = useState(null);
  const [result, setResult] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("footballUser") || "null"));

  useEffect(() => {
    fetch(`${API_URL}/players/top-2026`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (data.length) { setPlayers(data); setOpponentLineup(data.map((player) => { const [x, y, fieldPosition] = slotFor(player, "away"); return { player, x, y, fieldPosition, energy: playerEnergy(player) }; })); } })
      .catch(() => {}); // The demo cards remain visible until MongoDB has seed data.
  }, []);

  const teamRating = useMemo(() => lineup.length
    ? Math.round(lineup.reduce((total, item) => total + item.player.overallRating, 0) / lineup.length)
    : 0, [lineup]);

  const selectPlayer = (player) => {
    setSelected(player);
    const currentLineup = activeSide === "home" ? lineup : opponentLineup;
    if (currentLineup.some((item) => item.player._id === player._id)) return;
    const nextSpot = slotFor(player, activeSide);
    const add = (current) => [...current, { player, x: nextSpot[0], y: nextSpot[1], fieldPosition: nextSpot[2], energy: playerEnergy(player) }];
    activeSide === "home" ? setLineup(add) : setOpponentLineup(add);
  };

  const placePlayer = (playerId, x, y) => {
    const player = players.find((item) => item._id === playerId);
    if (!player) return;
    const update = (current) => {
      const old = current.find((item) => item.player._id === playerId);
      if (old) return current.map((item) => item.player._id === playerId ? { ...item, x, y } : item);
      return current.length >= 11 ? current : [...current, { player, x, y, fieldPosition: "CM", energy: playerEnergy(player) }];
    };
    activeSide === "home" ? setLineup(update) : setOpponentLineup(update);
    setSelected(player);
  };

  const movePlayer = (event, playerId) => {
    const rect = event.currentTarget.parentElement.getBoundingClientRect();
    placePlayer(playerId, Math.round(((event.clientX - rect.left) / rect.width) * 100), Math.round(((event.clientY - rect.top) / rect.height) * 100));
  };

  const arrangeAi = () => {
    setOpponentLineup(players.map((player) => {
      const [x, y, fieldPosition] = slotFor(player, "away");
      return { player, x: Math.max(8, Math.min(92, x + (Math.random() * 10 - 5))), y, fieldPosition, energy: playerEnergy(player) };
    }));
    setActiveSide("away");
  };

  const finishMatch = async (next) => {
    const localResult = next.home > next.away ? "winner" : next.home < next.away ? "lose" : "draw";
    try {
      const response = await fetch(`${API_URL}/games/${next.id}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("footballToken")}` },
        body: JSON.stringify({ score: { home: next.home, away: next.away }, reward: { coins: localResult === "winner" ? 100 : 25, experience: 50 } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setResult({ ...next, result: data.result, reward: data.reward });
    } catch (_error) { setResult({ ...next, result: localResult }); }
    setGame({ ...next, active: false });
  };

  const shoot = () => {
    if (!game.active || game.turn >= 3) return;
    const attacker = lineup[Math.floor(Math.random() * lineup.length)]?.player;
    const defender = opponentLineup[Math.floor(Math.random() * opponentLineup.length)]?.player;
    const scored = Math.random() < Math.min(0.88, 0.4 + (teamRating || 70) / 150);
    const opponentScored = Math.random() < 0.54;
    const next = { ...game, turn: game.turn + 1, home: game.home + Number(scored), away: game.away + Number(opponentScored) };
    next.message = scored ? "GOAL! Your selected squad wins the duel." : "Blocked! The opponent wins the duel.";
    setBattle({ attacker, defender, scored });
    window.setTimeout(() => setBattle(null), 1400);
    setGame(next);
    if (next.turn === 3) {
      setTimeout(() => finishMatch(next), 500);
    }
  };

  const resetTeam = () => { setLineup([]); setSelected(null); setActiveSide("home"); setGame({ active: false, id: null, turn: 0, home: 0, away: 0, message: "Choose your squad to begin." }); };
  const removeSelected = () => {
    if (!selected) return;
    const remove = (current) => current.filter((item) => item.player._id !== selected._id);
    activeSide === "home" ? setLineup(remove) : setOpponentLineup(remove);
    setSelected(null);
  };
  const startGame = async () => {
    if (!user) { setAuthOpen(true); return; }
    try {
      const response = await fetch(`${API_URL}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("footballToken")}` },
        body: JSON.stringify({ mode: "penalty-shootout", formation: "4-3-3", lineup: lineup.map((item) => ({ player: item.player._id, fieldPosition: item.fieldPosition, uiPosition: { x: item.x, y: item.y } })), opponent: { name: "World XI", overallRating: 90 } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      await fetch(`${API_URL}/games/${data._id}/start`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("footballToken")}` } });
      setGame({ active: true, id: data._id, turn: 0, home: 0, away: 0, message: "Three shots. Make your team proud!" });
    } catch (error) { setGame((current) => ({ ...current, message: error.message || "Cannot start game. Please try again." })); }
  };
  const signIn = ({ token, user: authenticatedUser }) => {
    localStorage.setItem("footballToken", token);
    localStorage.setItem("footballUser", JSON.stringify(authenticatedUser));
    setUser(authenticatedUser); setAuthOpen(false);
  };
  const signOut = () => { localStorage.removeItem("footballToken"); localStorage.removeItem("footballUser"); setUser(null); };

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-cyan-400 selection:text-slate-950">
      <header className="border-b border-white/10 bg-slate-950/80 px-5 py-4 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-slate-950"><Trophy size={23} /></div><div><p className="text-xs font-bold tracking-[.25em] text-cyan-300">FOOTBALL WORLD</p><h1 className="font-black tracking-tight">ULTIMATE 2026</h1></div></div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:flex"><Users size={16} /> {lineup.length}/11 PLAYERS</div>
            {user ? <><span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300 md:inline">{user.walletUnlimited ? "∞" : `$${(user.walletBalance ?? 1000).toLocaleString()}`}</span><button onClick={signOut} title="Log out" className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-bold text-cyan-200"><UserRound size={16} /> <span className="hidden sm:inline">{user.displayName}</span><LogOut size={15} /></button></> : <button onClick={() => setAuthOpen(true)} className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950">SIGN IN</button>}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-cyan-400/15 bg-gradient-to-br from-cyan-500/15 via-slate-950 to-fuchsia-600/10 px-5 py-10 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-7 md:flex-row md:justify-between"><div className="max-w-2xl"><p className="text-xs font-black tracking-[.28em] text-cyan-300">WELCOME TO THE PITCH</p><h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Your football stars are ready.</h2><p className="mt-3 text-slate-300">Build a dream XI, challenge the AI, or invite a friend to your own match room.</p><button onClick={() => document.querySelector(".pitch")?.scrollIntoView({ behavior: "smooth" })} className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950">MEET THE PLAYERS</button></div><div className="flex -space-x-5" aria-label="Featured football players">{players.slice(0, 4).map((player) => <img key={player._id} src={player.imageUrl} alt={player.name} className="h-24 w-24 rounded-full border-4 border-slate-950 object-cover shadow-xl md:h-28 md:w-28" />)}</div></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[320px_1fr_320px] lg:px-10">
        <aside className="order-2 rounded-3xl border border-white/10 bg-slate-900/70 p-4 lg:order-1">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold tracking-widest text-cyan-300">COLLECTION</p><h2 className="text-xl font-black">Top Players 2026</h2></div><Star className="text-amber-300" fill="currentColor" /></div>
          <div className="grid max-h-[62vh] grid-cols-2 gap-3 overflow-auto pr-1 lg:grid-cols-1">
            {players.map((player) => <button key={player._id} onClick={() => selectPlayer(player)} draggable onDragStart={(e) => e.dataTransfer.setData("playerId", player._id)} className={`group relative overflow-hidden rounded-2xl border text-left transition ${selected?._id === player._id ? "border-cyan-300 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}>
              <img src={player.imageUrl} alt="" className="h-20 w-full object-cover opacity-70 transition group-hover:scale-105 group-hover:opacity-100 lg:absolute lg:h-full" />
              <div className="relative p-2 lg:bg-gradient-to-r lg:from-slate-950/95 lg:to-transparent"><span className={`float-right text-lg font-black ${ratingTone(player.overallRating)}`}>{player.overallRating}</span><p className="truncate text-sm font-black">{player.shortName || player.name}</p><p className="text-[10px] font-bold text-slate-400">{player.position} · {player.club}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-400" style={{ width: `${playerEnergy(player)}%` }} /></div><p className="mt-1 flex items-center gap-1 text-[9px] font-black text-emerald-300"><Zap size={10} fill="currentColor" /> ENERGY {playerEnergy(player)}</p></div>
            </button>)}
          </div>
        </aside>

        <section className="order-1 lg:order-2">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-widest text-emerald-300">TACTICAL BOARD</p><h2 className="text-3xl font-black">Build your XI</h2></div><div className="rounded-xl bg-white/5 px-4 py-2 text-sm"><span className="text-slate-400">TEAM OVR </span><b className="text-cyan-300">{teamRating || "--"}</b></div></div>
          <div className="mb-3 flex flex-wrap gap-2"><button onClick={() => setActiveSide("home")} className={`rounded-xl px-4 py-2 text-xs font-black ${activeSide === "home" ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-300"}`}>YOUR TEAM ({lineup.length})</button><button onClick={() => setActiveSide("away")} className={`rounded-xl px-4 py-2 text-xs font-black ${activeSide === "away" ? "bg-rose-400 text-slate-950" : "bg-slate-800 text-slate-300"}`}>OPPONENT ({opponentLineup.length})</button><button onClick={arrangeAi} className="ml-auto flex items-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 text-xs font-black text-fuchsia-200"><WandSparkles size={15} /> AI AUTO-PLACE</button></div>
          <div className="pitch relative aspect-[.72] min-h-[420px] overflow-hidden rounded-[2rem] border-8 border-emerald-800/70 shadow-2xl shadow-emerald-950" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const rect = e.currentTarget.getBoundingClientRect(); placePlayer(e.dataTransfer.getData("playerId"), Math.round(((e.clientX - rect.left) / rect.width) * 100), Math.round(((e.clientY - rect.top) / rect.height) * 100)); }}>
            <div className="absolute inset-x-0 top-1/2 border-t border-white/60" /><div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60" /><div className="absolute inset-x-[22%] top-0 h-16 border-x border-b border-white/60" /><div className="absolute inset-x-[22%] bottom-0 h-16 border-x border-t border-white/60" />
            {lineup.map((item) => <PitchPlayer key={`home-${item.player._id}`} item={item} side="home" selected={selected?._id === item.player._id} draggable={activeSide === "home"} onSelect={() => { setSelected(item.player); setActiveSide("home"); }} onMove={(event) => movePlayer(event, item.player._id)} />)}
            {opponentLineup.map((item) => <PitchPlayer key={`away-${item.player._id}`} item={item} side="away" selected={selected?._id === item.player._id} draggable={activeSide === "away"} onSelect={() => { setSelected(item.player); setActiveSide("away"); }} onMove={(event) => movePlayer(event, item.player._id)} />)}
            {battle && <BattleEffect battle={battle} />}
            {!lineup.length && <div className="absolute inset-0 grid place-items-center text-center"><div><Shield className="mx-auto mb-3 text-emerald-200/70" size={48} /><p className="font-bold">Click or drag players here</p><p className="text-sm text-emerald-100/60">Create your starting lineup</p></div></div>}
          </div>
          <div className="mt-3 flex flex-wrap gap-3"><button onClick={resetTeam} className="flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"><RotateCcw size={15} /> Reset your lineup</button><button disabled={!selected} onClick={removeSelected} className="flex items-center gap-2 text-sm font-bold text-rose-300 transition hover:text-rose-100 disabled:opacity-40"><Trash2 size={15} /> Remove selected from {activeSide === "home" ? "your team" : "opponent"}</button></div>
        </section>

        <aside className="order-3 rounded-3xl border border-white/10 bg-slate-900/70 p-5"><p className="text-xs font-bold tracking-widest text-fuchsia-300">MINI GAME</p><h2 className="mt-1 text-2xl font-black">Penalty Clash</h2><p className="mt-2 text-sm leading-6 text-slate-400">Your selected players power up the chance of every shot.</p>
          <div className="my-6 rounded-2xl bg-slate-950 p-5 text-center"><p className="text-xs font-bold tracking-widest text-slate-500">ROUND {game.turn}/3</p><div className="my-2 text-5xl font-black"><span className="text-cyan-300">{game.home}</span><span className="mx-3 text-slate-600">:</span><span>{game.away}</span></div><p className="min-h-10 text-sm text-slate-300">{game.message}</p></div>
          {!game.active ? <button disabled={!lineup.length} onClick={startGame} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"><Play size={18} fill="currentColor" /> {user ? "START GAME" : "SIGN IN TO PLAY"}</button> : <button onClick={shoot} className="w-full rounded-xl bg-fuchsia-500 py-3 font-black transition hover:bg-fuchsia-400">TAKE THE SHOT</button>}
          <p className="mt-4 text-center text-xs text-slate-500">Selected: {selected ? selected.name : "None"}</p>
        </aside>
      </section>

      {user && <section className="mx-auto max-w-md px-5 pb-10 lg:px-10"><RoomLobby user={user} /></section>}
      {user?.role === "admin" && <AdminPanel />}

      {result && <ResultModal result={result} onClose={() => setResult(null)} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={signIn} />}
    </main>
  );
}

function BattleEffect({ battle }) {
  return <div className="battle-effect absolute inset-0 z-30 overflow-hidden bg-slate-950/25 pointer-events-none"><p className="battle-title"><Swords size={16} /> 1 VS 1 DUEL</p><div className="battle-runner battle-attacker"><img src={battle.attacker?.imageUrl} alt="" /><b>{battle.attacker?.shortName || battle.attacker?.name}</b><span>ATTACK</span></div><div className="battle-ball">⚽</div><div className="battle-impact"><Swords className="battle-swords" size={42} /></div><div className="battle-runner battle-defender"><img src={battle.defender?.imageUrl} alt="" /><b>{battle.defender?.shortName || battle.defender?.name}</b><span>DEFEND</span></div><div className={`battle-result ${battle.scored ? "battle-win" : "battle-loss"}`}>{battle.scored ? "GOAL! BREAKTHROUGH" : "TACKLE! BALL LOST"}</div></div>;
}

function PitchPlayer({ item, side, selected, draggable, onMove, onSelect }) {
  const isMbappe = item.player.shortName?.toUpperCase().includes("MBAPP") || item.player.name.toUpperCase().includes("MBAPP");
  const energy = item.energy ?? playerEnergy(item.player);
  return <button onPointerDown={onSelect} onPointerUp={draggable ? onMove : undefined} className={`absolute -translate-x-1/2 -translate-y-1/2 touch-none transition duration-200 ${selected ? "z-20 scale-110" : "z-10 hover:scale-105"} ${draggable ? "cursor-move" : "cursor-default"}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} aria-label={`${item.player.name}, ${item.fieldPosition}, energy ${energy}`}>
    <span className={`relative block h-14 w-14 overflow-hidden rounded-full border-2 bg-slate-950 shadow-xl ${side === "home" ? "border-cyan-300" : "border-rose-300"} ${isMbappe ? "ring-4 ring-amber-300/70 shadow-amber-300/30" : ""}`}><img src={item.player.imageUrl} alt="" className="h-full w-full object-cover" />{isMbappe && <span className="absolute inset-x-0 bottom-0 bg-amber-300 py-px text-[8px] font-black text-slate-950">STAR</span>}</span>
    <span className="mt-1 block whitespace-nowrap rounded-md bg-slate-950/90 px-1.5 py-0.5 text-[9px] font-black"><b className={side === "home" ? "text-cyan-300" : "text-rose-300"}>{item.fieldPosition}</b> <span className="text-emerald-300">⚡{energy}</span></span>
  </button>;
}

function ResultModal({ result, onClose }) {
  const won = result.result === "winner";
  const draw = result.result === "draw";
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-5 backdrop-blur-sm"><div className={`w-full max-w-md overflow-hidden rounded-[2rem] border text-center shadow-2xl ${won ? "border-amber-300/50" : draw ? "border-cyan-300/50" : "border-rose-400/50"}`}><div className={`p-9 ${won ? "bg-amber-300 text-slate-950" : draw ? "bg-cyan-400 text-slate-950" : "bg-rose-500"}`}><Crown className="mx-auto mb-3" size={46} fill="currentColor" /><p className="text-sm font-black tracking-[.25em]">MATCH COMPLETE</p><h2 className="mt-2 text-5xl font-black">{won ? "WINNER!" : draw ? "DRAW" : "LOSE"}</h2></div><div className="bg-slate-900 p-7"><p className="text-5xl font-black"><span className="text-cyan-300">{result.home}</span><span className="mx-4 text-slate-600">:</span>{result.away}</p><p className="mt-3 text-slate-400">{won ? "Your team played like champions." : draw ? "A close match. Go again for the win!" : "Train your squad and try another match."}</p><button onClick={onClose} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-black text-slate-950"><X size={18} /> CLOSE RESULT</button></div></div></div>;
}

export default App;
