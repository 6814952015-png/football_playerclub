import { useEffect, useState } from "react";
import { Ban, CircleDollarSign, Pencil, Save, ShieldCheck, Users } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const adminRequest = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("footballToken")}`, ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
};

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([adminRequest("/admin/users"), adminRequest("/players")])
      .then(([nextUsers, nextPlayers]) => { setUsers(nextUsers); setPlayers(nextPlayers); })
      .catch((loadError) => setError(loadError.message));
  }, []);

  const changeRole = async (id, role) => {
    try {
      const updated = await adminRequest(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) });
      setUsers((current) => current.map((user) => user._id === id ? updated : user));
    } catch (requestError) { setError(requestError.message); }
  };

  const updateUser = async (id, changes) => {
    try {
      const updated = await adminRequest(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
      setUsers((current) => current.map((user) => user._id === id ? updated : user));
    } catch (requestError) { setError(requestError.message); }
  };

  const savePlayer = async (event) => {
    event.preventDefault();
    try {
      const updated = await adminRequest(`/players/${editing._id}`, { method: "PATCH", body: JSON.stringify({ name: editing.name, club: editing.club, overallRating: Number(editing.overallRating), isActive: editing.isActive }) });
      setPlayers((current) => current.map((player) => player._id === updated._id ? updated : player)); setEditing(null);
    } catch (requestError) { setError(requestError.message); }
  };

  return <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-10"><div className="rounded-3xl border border-amber-300/30 bg-amber-300/5 p-5 sm:p-7"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300 text-slate-950"><ShieldCheck /></div><div><p className="text-xs font-bold tracking-widest text-amber-300">ADMINISTRATION</p><h2 className="text-2xl font-black">Manage users & players</h2></div></div>{error && <p className="mt-4 rounded-lg bg-rose-500/15 p-3 text-sm text-rose-300">{error}</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><div><h3 className="mb-3 flex items-center gap-2 font-black"><Users size={17} /> Users</h3><div className="max-h-80 space-y-2 overflow-auto pr-1">{users.map((user) => <div key={user._id} className="rounded-xl bg-slate-950/70 p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{user.displayName} {user.isBanned && <span className="text-rose-300">(BANNED)</span>}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div><select aria-label={`Role for ${user.displayName}`} value={user.role} onChange={(event) => changeRole(user._id, event.target.value)} className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-xs font-bold text-cyan-200"><option value="player">PLAYER</option><option value="admin">ADMIN</option></select></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => updateUser(user._id, { isBanned: !user.isBanned })} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black ${user.isBanned ? "bg-emerald-400 text-slate-950" : "bg-rose-500/20 text-rose-200"}`}><Ban size={13} /> {user.isBanned ? "UNBAN" : "BAN"}</button><button onClick={() => updateUser(user._id, { walletUnlimited: !user.walletUnlimited })} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black ${user.walletUnlimited ? "bg-amber-300 text-slate-950" : "bg-amber-300/15 text-amber-200"}`}><CircleDollarSign size={13} /> {user.walletUnlimited ? "UNLIMITED ON" : "UNLIMITED OFF"}</button></div></div>)}</div></div>
      <div><h3 className="mb-3 flex items-center gap-2 font-black"><Pencil size={17} /> Players</h3><div className="max-h-80 space-y-2 overflow-auto pr-1">{players.map((player) => <div key={player._id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/70 p-3"><div><p className="text-sm font-bold">{player.name}</p><p className="text-xs text-slate-500">{player.club} · OVR {player.overallRating}</p></div><button onClick={() => setEditing({ ...player })} className="rounded-lg border border-white/10 p-2 text-cyan-300 hover:bg-white/5" aria-label={`Edit ${player.name}`}><Pencil size={15} /></button></div>)}</div></div></div>
    {editing && <form onSubmit={savePlayer} className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 sm:grid-cols-4"><input required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="rounded-lg bg-slate-800 p-2 text-sm" placeholder="Name" /><input required value={editing.club} onChange={(event) => setEditing({ ...editing, club: event.target.value })} className="rounded-lg bg-slate-800 p-2 text-sm" placeholder="Club" /><input required type="number" min="1" max="100" value={editing.overallRating} onChange={(event) => setEditing({ ...editing, overallRating: event.target.value })} className="rounded-lg bg-slate-800 p-2 text-sm" placeholder="Rating" /><button className="flex items-center justify-center gap-2 rounded-lg bg-amber-300 p-2 text-sm font-black text-slate-950"><Save size={16} /> SAVE</button></form>}</div></section>;
}
