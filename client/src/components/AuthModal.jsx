import { useState } from "react";
import { LogIn, UserPlus, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/users/${mode === "login" ? "login" : "register"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email: form.email, password: form.password } : form),
      });
      const raw = await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch (_error) { /* handled below */ }
      if (!response.ok) {
        throw new Error(data?.message || "The API server is unavailable. Start the backend and try again.");
      }
      if (!data?.token || !data?.user) throw new Error("The API returned an invalid login response.");
      onSuccess(data);
    } catch (requestError) {
      const unavailable = requestError instanceof TypeError && /fetch/i.test(requestError.message);
      setError(unavailable ? "The API server is unavailable. Start the backend and try again." : requestError.message);
    } finally { setLoading(false); }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-5 backdrop-blur-sm"><form onSubmit={submit} className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-7 shadow-2xl"><button type="button" onClick={onClose} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X /></button><div className="mb-6"><p className="text-xs font-black tracking-[.2em] text-cyan-300">FOOTBALL WORLD 2026</p><h2 className="mt-1 text-3xl font-black">{mode === "login" ? "Welcome back" : "Create account"}</h2></div>
    {mode === "register" && <><label className="auth-label">Display name<input required minLength="2" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Your name" /></label><label className="auth-label">Username<input required minLength="3" pattern="[a-zA-Z0-9_]+" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="football_fan" /></label></>}
    <label className="auth-label">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label><label className="auth-label">Password<input required type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></label>
    {error && <p className="mt-3 rounded-lg bg-rose-500/15 p-3 text-sm text-rose-300">{error}</p>}
    {mode === "register" && <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">New accounts receive $1,000 starting credit.</p>}
    <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 font-black text-slate-950 disabled:opacity-60">{mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}{loading ? "PLEASE WAIT..." : mode === "login" ? "LOG IN" : "CREATE ACCOUNT"}</button>
    <p className="mt-5 text-center text-sm text-slate-400">{mode === "login" ? "New player?" : "Already have an account?"} <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="font-bold text-cyan-300">{mode === "login" ? "Create an account" : "Log in"}</button></p>
  </form></div>;
}
