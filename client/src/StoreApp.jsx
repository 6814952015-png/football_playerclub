import { useState } from "react";
import { ArrowDown, LogOut, ShoppingBag, Trophy, UserRound, WalletCards, X } from "lucide-react";
import { demoPlayers, getPlayerPortrait } from "./data/players";
import AuthModal from "./components/AuthModal";
import AdminPanel from "./components/AdminPanel";
import PlayerMarket from "./components/PlayerMarket";

function readSavedUser() {
  try { return JSON.parse(localStorage.getItem("footballUser") || "null"); }
  catch (_error) { return null; }
}

export default function StoreApp() {
  const [user, setUser] = useState(readSavedUser);
  const [authOpen, setAuthOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  const signIn = ({ token, user: authenticatedUser }) => {
    localStorage.setItem("footballToken", token);
    localStorage.setItem("footballUser", JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    setAuthOpen(false);
  };

  const updateUser = (nextUser) => {
    localStorage.setItem("footballUser", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const signOut = () => {
    localStorage.removeItem("footballToken");
    localStorage.removeItem("footballUser");
    setUser(null);
  };

  return <main className="min-h-screen bg-slate-950 text-white selection:bg-cyan-300 selection:text-slate-950">
    {welcomeOpen && <div className="welcome-overlay fixed inset-0 z-[60] grid place-items-center overflow-hidden p-4" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-glow" aria-hidden="true" />
      <button onClick={() => setWelcomeOpen(false)} aria-label="Close welcome" className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-slate-950/70 text-white transition hover:bg-white/15"><X size={21} /></button>
      <div className="welcome-card relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900/95 shadow-2xl md:grid-cols-[1.05fr_.95fr]">
        <div className="welcome-photo relative min-h-[300px] md:min-h-[570px]">
          <img src={getPlayerPortrait(demoPlayers[1])} alt="Erling Haaland" className="absolute inset-0 h-full w-full object-cover object-[center_20%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent md:bg-gradient-to-r md:from-transparent md:via-slate-950/10 md:to-slate-900" />
          <span className="absolute bottom-5 left-6 rounded-full border border-white/25 bg-slate-950/65 px-3 py-1.5 text-xs font-black tracking-[.18em] text-white backdrop-blur">THE NORWEGIAN MACHINE · 9</span>
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10 md:p-12">
          <p className="text-xs font-black tracking-[.25em] text-cyan-300">WELCOME TO FOOTBALL CARD SELL</p>
          <h1 id="welcome-title" className="mt-5 text-4xl font-black leading-[.95] tracking-tight md:text-6xl">ERLING<br /><span className="text-cyan-300">HAALAND</span></h1>
          <p className="mt-5 max-w-md text-slate-300">Find your next star. Choose player cards, add them to your basket, and grow your collection.</p>
          <button onClick={() => { setWelcomeOpen(false); document.querySelector("#player-market")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-200">SHOP PLAYER CARDS <ArrowDown size={18} /></button>
          <p className="mt-4 text-center text-xs text-slate-500">Build your collection one card at a time.</p>
        </div>
      </div>
    </div>}

    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur-xl sm:px-7">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <a href="#player-market" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-slate-950"><Trophy size={22} /></div>
          <div><p className="text-[10px] font-black tracking-[.22em] text-cyan-300">WELCOME TO</p><h1 className="font-black tracking-tight">FOOTBALL CARD SELL</h1></div>
        </a>
        <div className="flex items-center gap-2">
          {user && <span className="hidden items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-200 sm:flex"><WalletCards size={15} /> {user.walletUnlimited ? "UNLIMITED" : `$${(user.walletBalance ?? 1000).toLocaleString()}`}</span>}
          {user ? <button onClick={signOut} title="Sign out" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"><UserRound size={16} /><span className="hidden sm:inline">{user.displayName}</span><LogOut size={15} /></button> : <button onClick={() => setAuthOpen(true)} className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200">SIGN IN</button>}
        </div>
      </div>
    </header>

    <section className="border-b border-cyan-300/10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/10 via-slate-950 to-slate-950 px-5 py-9 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs font-black tracking-[.25em] text-cyan-300">THE PLAYER CARD MARKET</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Your next star is here.</h2><p className="mt-2 max-w-xl text-sm text-slate-400">Add cards to your basket and check out securely with your club wallet.</p></div>
        <a href="#player-market" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200"><ShoppingBag size={17} /> Browse cards</a>
      </div>
    </section>

    <PlayerMarket user={user} onSignIn={() => setAuthOpen(true)} onUserUpdate={updateUser} />
    {user?.role === "admin" && <AdminPanel />}

    <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">FOOTBALL CARD SELL · Build your collection with your club wallet</footer>
    {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={signIn} />}
  </main>;
}

