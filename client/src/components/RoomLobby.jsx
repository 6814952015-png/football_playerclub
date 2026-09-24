import { useEffect, useState } from "react";
import { Bot, Copy, DoorOpen, LoaderCircle, LogOut, Plus, Trash2, UserMinus, Users, WalletCards, Wifi } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const request = async (path, token, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.message || "Unable to update room");
  return data;
};

export default function RoomLobby({ user }) {
  const token = localStorage.getItem("footballToken");
  const [room, setRoom] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadRooms = async () => {
    try {
      const rooms = await request("/rooms/mine", token);
      setRoom(rooms.find((item) => item.status !== "finished") || null);
    } catch (loadError) { setError(loadError.message); }
  };

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => {
    if (!room || room.status !== "waiting") return undefined;
    const interval = window.setInterval(async () => {
      try { setRoom(await request(`/rooms/${room.code}`, token)); } catch (_error) { window.clearInterval(interval); }
    }, 3000);
    return () => window.clearInterval(interval);
  }, [room?.code, room?.status]);

  const submit = async (action) => {
    setError(""); setLoading(true);
    try {
      const nextRoom = action === "create"
        ? await request("/rooms", token, { method: "POST", body: JSON.stringify({ name: roomName || `${user.displayName}'s room` }) })
        : await request(`/rooms/${joinCode.trim().toUpperCase()}/join`, token, { method: "POST" });
      setRoom(nextRoom); setRoomName(""); setJoinCode("");
    } catch (submitError) { setError(submitError.message); } finally { setLoading(false); }
  };

  const leave = async () => {
    setError(""); setLoading(true);
    try { await request(`/rooms/${room.code}/leave`, token, { method: "DELETE" }); setRoom(null); } catch (leaveError) { setError(leaveError.message); } finally { setLoading(false); }
  };

  const removeGuest = async () => {
    setError(""); setLoading(true);
    try { setRoom(await request(`/rooms/${room.code}/guest`, token, { method: "DELETE" })); }
    catch (removeError) { setError(removeError.message); } finally { setLoading(false); }
  };

  const createAiRoom = async (difficulty) => {
    setError(""); setLoading(true);
    try { setRoom(await request("/rooms/ai", token, { method: "POST", body: JSON.stringify({ difficulty }) })); }
    catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  };

  const copyCode = async () => {
    await navigator.clipboard?.writeText(room.code);
    setCopied(true); window.setTimeout(() => setCopied(false), 1500);
  };

  if (room) return <section className="rounded-3xl border border-cyan-400/30 bg-cyan-400/5 p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold tracking-widest text-cyan-300">{room.opponentType === "ai" ? "AI MATCH ROOM" : "2-PLAYER ROOM"}</p><h2 className="mt-1 text-xl font-black">{room.name}</h2></div><span className={`rounded-full px-2 py-1 text-[10px] font-black ${room.status === "ready" ? "bg-emerald-400 text-slate-950" : "bg-amber-300 text-slate-950"}`}>{room.status === "ready" ? "READY" : "WAITING"}</span></div>
    <button onClick={copyCode} className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-left"><span><span className="block text-[10px] font-bold text-slate-500">ROOM CODE</span><b className="tracking-[.22em] text-cyan-200">{room.code}</b></span><Copy size={17} className="text-cyan-300" /></button>
    <p className="mt-2 text-center text-xs text-slate-400">{copied ? "Copied!" : `Share this code with one friend · $${room.budgetLimit ?? 1000} budget`}</p>
    <div className="mt-4 space-y-2"><PlayerSlot player={room.host} label="HOST" /><PlayerSlot player={room.opponentType === "ai" ? { displayName: `AI ${room.aiDifficulty?.toUpperCase()}` } : room.guest} label={room.opponentType === "ai" ? "OPPONENT" : "GUEST"} /></div>
    {room.status === "waiting" && <p className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-200"><LoaderCircle size={14} className="animate-spin" /> Waiting for player 2…</p>}
    {room.status === "ready" && <p className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-300"><Wifi size={14} /> Both players are in the room.</p>}
    {String(room.host?._id) === String(user._id) && room.guest && <button disabled={loading} onClick={removeGuest} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/30 py-2 text-sm font-bold text-amber-200 hover:bg-amber-300/10"><UserMinus size={15} /> REMOVE PLAYER FROM ROOM</button>}
    <button disabled={loading} onClick={leave} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 py-2 text-sm font-bold text-rose-200 hover:bg-rose-400/10">{String(room.host?._id) === String(user._id) ? <><Trash2 size={15} /> DELETE ROOM</> : <><LogOut size={15} /> Leave room</>}</button>
  </section>;

  return <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5"><p className="text-xs font-bold tracking-widest text-cyan-300">MATCH ROOMS</p><h2 className="mt-1 text-xl font-black">Play with a friend or AI</h2><div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm"><WalletCards size={18} className="text-emerald-300" /><span className="text-slate-300">Account credit</span><b className="ml-auto text-emerald-300">{user.walletUnlimited ? "∞" : `$${(user.walletBalance ?? 1000).toLocaleString()}`}</b></div>
    <div className="mt-4 space-y-4"><div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/5 p-4"><p className="text-xs font-black tracking-widest text-cyan-300">CREATE A NEW ROOM</p><p className="mt-1 text-sm text-slate-400">2 players · room budget is fixed at $1,000</p><label className="auth-label">Room name<input maxLength="50" value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder={`${user.displayName}'s room`} /></label><button disabled={loading} onClick={() => submit("create")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-sm font-black text-slate-950 disabled:opacity-60"><Plus size={17} /> CREATE ROOM ($1,000)</button></div>
    <div className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/5 p-4"><p className="flex items-center gap-2 text-xs font-black tracking-widest text-fuchsia-300"><Bot size={15} /> CHALLENGE THE AI</p><p className="mt-1 text-sm text-slate-400">Instant match room, no code needed.</p><div className="mt-3 grid grid-cols-3 gap-2">{["easy", "normal", "hard"].map((difficulty) => <button key={difficulty} disabled={loading} onClick={() => createAiRoom(difficulty)} className="rounded-lg border border-fuchsia-400/30 px-2 py-2 text-xs font-black text-fuchsia-200 hover:bg-fuchsia-400 hover:text-slate-950">{difficulty.toUpperCase()}</button>)}</div></div>
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><p className="text-xs font-black tracking-widest text-fuchsia-300">JOIN AN EXISTING ROOM</p><label className="auth-label">Friend's room code<input maxLength="6" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="ABC123" /></label><button disabled={loading || joinCode.length !== 6} onClick={() => submit("join")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/50 py-3 text-sm font-black text-cyan-200 disabled:opacity-50"><DoorOpen size={17} /> JOIN ROOM</button></div></div>
    {error && <p className="mt-3 rounded-lg bg-rose-500/15 p-3 text-sm text-rose-300">{error}</p>}
  </section>;
}

function PlayerSlot({ player, label }) {
  return <div className="flex items-center gap-3 rounded-xl bg-slate-950/70 p-3"><div className={`grid h-9 w-9 place-items-center rounded-full ${player ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-500"}`}><Users size={16} /></div><div><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="text-sm font-bold">{player?.displayName || "Open slot"}</p></div></div>;
}
