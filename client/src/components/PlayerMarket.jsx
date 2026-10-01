import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, CreditCard, Crown, Gem, LoaderCircle, Plus, Search, ShoppingBag, Sparkles, Star, Trash2, WalletCards, X } from "lucide-react";
import { getPlayerPortrait } from "../data/players";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const positions = ["ALL", "FWD", "MID", "DEF", "GK"];
const rarities = ["ALL", "MYTHIC", "LEGENDARY", "EPIC", "RARE"];
const rarityIcons = { MYTHIC: Sparkles, LEGENDARY: Crown, EPIC: Gem, RARE: Star };
const money = (value) => "$" + Number(value || 0).toLocaleString();

function rarityFor(rating) {
  if (rating >= 94) return { name: "MYTHIC", frame: "border-amber-200/80 shadow-[0_0_34px_rgba(251,191,36,.28)]", badge: "border-amber-200/40 bg-amber-300/20 text-amber-100", glow: "from-amber-300/35 via-orange-400/10 to-transparent", price: "text-amber-200" };
  if (rating >= 92) return { name: "LEGENDARY", frame: "border-fuchsia-300/70 shadow-[0_0_30px_rgba(232,121,249,.22)]", badge: "border-fuchsia-200/40 bg-fuchsia-300/20 text-fuchsia-100", glow: "from-fuchsia-400/30 via-violet-400/10 to-transparent", price: "text-fuchsia-200" };
  if (rating >= 90) return { name: "EPIC", frame: "border-sky-300/65 shadow-[0_0_28px_rgba(56,189,248,.18)]", badge: "border-sky-200/40 bg-sky-300/20 text-sky-100", glow: "from-sky-300/30 via-blue-400/10 to-transparent", price: "text-sky-200" };
  return { name: "RARE", frame: "border-emerald-300/55 shadow-[0_0_24px_rgba(52,211,153,.15)]", badge: "border-emerald-200/40 bg-emerald-300/20 text-emerald-100", glow: "from-emerald-300/25 via-teal-400/10 to-transparent", price: "text-emerald-200" };
}

async function readResponse(response) {
  const raw = await response.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch (_error) { data = {}; }
  if (!response.ok) throw new Error(data.message || "The market request failed.");
  return data;
}

function savedCart() {
  try {
    const ids = JSON.parse(localStorage.getItem("footballCardCart") || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch (_error) { return []; }
}

function RarityTag({ rarity, compact = false }) {
  const Icon = rarityIcons[rarity.name];
  return <span className={"inline-flex items-center gap-1.5 rounded-full border font-black tracking-[.14em] " + rarity.badge + (compact ? " px-2 py-1 text-[8px]" : " px-2.5 py-1.5 text-[9px]")}>
    <Icon size={compact ? 11 : 13} strokeWidth={2.8} />{rarity.name}
  </span>;
}

export default function PlayerMarket({ user, onSignIn, onUserUpdate }) {
  const [players, setPlayers] = useState([]);
  const [ownedPlayers, setOwnedPlayers] = useState([]);
  const [cartIds, setCartIds] = useState(savedCart);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("ALL");
  const [rarityFilter, setRarityFilter] = useState("ALL");
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem("footballCardCart", JSON.stringify(cartIds));
  }, [cartIds]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch(API_URL + "/market/players")
      .then(readResponse)
      .then((data) => { if (active) setPlayers(data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      setOwnedPlayers([]);
      return () => { active = false; };
    }
    fetch(API_URL + "/market/mine", { headers: { Authorization: "Bearer " + localStorage.getItem("footballToken") } })
      .then(readResponse)
      .then((data) => { if (active) setOwnedPlayers(data.ownedPlayers || []); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [user?._id]);

  useEffect(() => {
    if (!cartOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setCartOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [cartOpen]);

  const ownedIds = useMemo(() => new Set(ownedPlayers.map((item) => String(item.player?._id || item.player))), [ownedPlayers]);
  const cartPlayers = useMemo(() => players.filter((player) => cartIds.includes(String(player._id)) && !ownedIds.has(String(player._id))), [players, cartIds, ownedIds]);
  const total = cartPlayers.reduce((sum, player) => sum + player.price, 0);
  const walletBalance = user?.walletBalance ?? 1000;
  const recommendedPlayers = useMemo(() => {
    const available = players.filter((player) => !ownedIds.has(String(player._id)) && (user?.walletUnlimited || player.price <= walletBalance));
    const picks = [];
    const add = (player, title, reason) => {
      if (player && !picks.some((pick) => String(pick.player._id) === String(player._id))) picks.push({ player, title, reason });
    };
    const byRating = [...available].sort((a, b) => b.overallRating - a.overallRating || a.price - b.price);
    const best = byRating[0];
    add(best, "TOP RATED", best ? `Highest rating available in your ${user?.walletUnlimited ? "club wallet" : money(walletBalance) + " budget"}.` : "No cards currently fit your budget.");
    const value = [...available].sort((a, b) => (b.overallRating / Math.max(1, b.price)) - (a.overallRating / Math.max(1, a.price)) || a.price - b.price).find((player) => String(player._id) !== String(best?._id));
    add(value, "BUDGET PICK", value ? `Strong ${value.overallRating} rating at ${money(value.price)}.` : "A smart starting point for a new collection.");
    const rare = byRating.find((player) => String(player._id) !== String(best?._id) && String(player._id) !== String(value?._id) && ["MYTHIC", "LEGENDARY", "EPIC"].includes(rarityFor(player.overallRating).name));
    add(rare, "RARE FIND", rare ? `${rarityFor(rare.overallRating).name} tier, ranked by player rating.` : "A highly rated card to round out your picks.");
    return picks;
  }, [players, ownedIds, walletBalance, user?.walletUnlimited]);
  const filteredPlayers = players.filter((player) => {
    const matchesPosition = position === "ALL" || player.position === position;
    const matchesRarity = rarityFilter === "ALL" || rarityFor(player.overallRating).name === rarityFilter;
    const searchText = (player.name + " " + player.club + " " + player.nationality).toLowerCase();
    return matchesPosition && matchesRarity && searchText.includes(search.toLowerCase());
  });

  const addToCart = (player) => {
    setNotice("");
    setCartIds((current) => current.includes(String(player._id)) ? current : [...current, String(player._id)]);
    setCartOpen(true);
  };

  const removeFromCart = (id) => setCartIds((current) => current.filter((item) => item !== String(id)));

  const checkout = async () => {
    if (!user) { setCartOpen(false); onSignIn(); return; }
    if (!cartPlayers.length) return;
    setCheckingOut(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(API_URL + "/market/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("footballToken"),
        },
        body: JSON.stringify({ playerIds: cartPlayers.map((player) => String(player._id)) }),
      });
      const data = await readResponse(response);
      setOwnedPlayers(data.user?.ownedPlayers || [...data.purchased, ...ownedPlayers]);
      onUserUpdate(data.user);
      setCartIds((current) => current.filter((id) => !cartPlayers.some((player) => String(player._id) === id)));
      setNotice("Purchase complete. " + data.purchased.length + " player card" + (data.purchased.length === 1 ? "" : "s") + " added to your collection.");
      setCartOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return <section id="player-market" className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-7 lg:py-10 lg:pb-16">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black tracking-[.22em] text-emerald-300">PLAYER MARKET</p><h2 className="mt-1 text-3xl font-black">Pick your players</h2><p className="mt-2 text-sm text-slate-400">Collect cards from RARE to MYTHIC. Add them to your basket and buy with your club wallet.</p></div>
      <button onClick={() => setCartOpen(true)} className="group flex items-center gap-3 rounded-2xl border border-emerald-200/20 bg-gradient-to-br from-emerald-300/15 to-teal-400/10 px-4 py-3 text-left shadow-lg shadow-emerald-950/20 transition hover:border-emerald-200/50 hover:from-emerald-300/25">
        <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-400/20"><ShoppingBag size={20} /><span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full border-2 border-slate-950 bg-amber-300 px-1 text-[9px] font-black">{cartPlayers.length}</span></span>
        <span><b className="block text-sm">Your basket</b><span className="block text-xs text-slate-400">{cartPlayers.length ? money(total) + " · View cards" : "Ready for your picks"}</span></span>
      </button>
    </div>

    {(error || notice) && <div role={error ? "alert" : "status"} className={"mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm " + (error ? "border-rose-300/20 bg-rose-400/10 text-rose-200" : "border-emerald-300/20 bg-emerald-400/10 text-emerald-200")}>
      {error ? <CircleAlert size={18} className="mt-0.5 shrink-0" /> : <Check size={18} className="mt-0.5 shrink-0" />}{error || notice}
    </div>}

    {!loading && recommendedPlayers.length > 0 && <section aria-labelledby="recommendations-title" className="mb-8 overflow-hidden rounded-[1.75rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-400/[.09] via-slate-900/90 to-slate-950 p-4 shadow-xl shadow-emerald-950/20 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="flex items-center gap-2 text-[10px] font-black tracking-[.2em] text-emerald-200"><Sparkles size={14} /> PERSONAL PICKS</p><h3 id="recommendations-title" className="mt-1 text-2xl font-black">A good place to start</h3></div><p className="max-w-sm text-xs leading-relaxed text-slate-400">Picks use card rating, price, rarity, and your available wallet. They’re collection suggestions, not promises of future value.</p></div>
      <div className="grid gap-3 md:grid-cols-3">{recommendedPlayers.map(({ player, title, reason }) => { const rarity = rarityFor(player.overallRating); const inCart = cartIds.includes(String(player._id)); return <article key={player._id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/65 p-3 transition hover:border-emerald-200/30"><img src={getPlayerPortrait(player)} alt="" loading="lazy" className="h-24 w-16 shrink-0 rounded-xl object-cover object-top ring-1 ring-white/10" /><div className="min-w-0 flex-1"><p className="text-[9px] font-black tracking-[.16em] text-emerald-200">{title}</p><h4 className="truncate text-lg font-black">{player.shortName || player.name}</h4><div className="mt-1 flex items-center gap-2"><span className="text-xs font-bold text-white">OVR {player.overallRating}</span><RarityTag rarity={rarity} compact /></div><p className="mt-1 line-clamp-2 text-[11px] text-slate-400">{reason}</p><div className="mt-2 flex items-center justify-between gap-2"><b className={"text-sm font-black " + rarity.price}>{money(player.price)}</b><button onClick={() => addToCart(player)} disabled={inCart || ownedIds.has(String(player._id))} className="rounded-lg bg-emerald-300 px-3 py-1.5 text-[10px] font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-default disabled:bg-white/10 disabled:text-slate-400">{inCart ? "IN BASKET" : "ADD CARD"}</button></div></div></article>; })}</div>
    </section>}

    <div className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-[.2em] text-slate-500"><Sparkles size={14} className="text-amber-200" /> CARD RARITY</div>
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{rarities.map((item) => {
      const level = item === "ALL" ? null : rarityFor(({ MYTHIC: 94, LEGENDARY: 92, EPIC: 90, RARE: 89 })[item]);
      const Icon = level ? rarityIcons[item] : Sparkles;
      return <button key={item} onClick={() => setRarityFilter(item)} className={"inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-black tracking-[.12em] transition " + (rarityFilter === item ? (level ? level.badge : "border-white/20 bg-white/10 text-white") : "border-white/10 bg-slate-900/70 text-slate-500 hover:border-white/20 hover:text-slate-200")}>
        <Icon size={13} />{item === "ALL" ? "ALL CARDS" : item}
      </button>;
    })}</div>

    <div className="mb-6 flex flex-wrap gap-2">
      <label className="flex min-w-52 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 text-slate-400"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search player or club" className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500" /></label>
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-slate-900 p-1">{positions.map((item) => <button key={item} onClick={() => setPosition(item)} className={"rounded-lg px-3 py-2 text-[10px] font-black tracking-wide transition " + (position === item ? "bg-emerald-300 text-slate-950" : "text-slate-400 hover:text-white")}>{item}</button>)}</div>
    </div>

    {loading ? <div className="grid min-h-64 place-items-center rounded-2xl border border-white/10 bg-slate-900/60 text-slate-400"><div className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={18} /> Loading player cards…</div></div>
      : filteredPlayers.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filteredPlayers.map((player) => {
        const id = String(player._id);
        const inCart = cartIds.includes(id);
        const owned = ownedIds.has(id);
        const rarity = rarityFor(player.overallRating);
        const RarityIcon = rarityIcons[rarity.name];
        return <article key={id} className={"market-player-card group relative overflow-hidden rounded-[1.55rem] border bg-slate-950 p-1 transition duration-300 hover:-translate-y-1.5 hover:scale-[1.01] " + rarity.frame}>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[.08] via-transparent to-black/30" />
          <div className={"pointer-events-none absolute -inset-1/2 bg-gradient-to-br " + rarity.glow + " opacity-75 transition duration-500 group-hover:opacity-100"} />
          <div className="market-card-foil pointer-events-none absolute inset-0 z-10 opacity-0 transition duration-500 group-hover:opacity-100" />
          <div className="relative h-[21rem] overflow-hidden rounded-[1.25rem] bg-slate-900 sm:h-[23rem]">
            <img src={getPlayerPortrait(player)} alt={player.name} className="absolute inset-0 h-full w-full object-cover object-top transition duration-700 group-hover:scale-110" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent" />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="rounded-lg border border-white/20 bg-slate-950/75 px-2.5 py-1.5 text-[9px] font-black tracking-[.18em] text-white backdrop-blur">{player.position}</span>
              <RarityTag rarity={rarity} compact />
            </div>
            <div className="absolute right-3 top-3 grid h-[4.35rem] w-[4.35rem] place-items-center rounded-2xl border border-white/25 bg-slate-950/70 text-center shadow-xl backdrop-blur">
              <span><b className="block text-2xl font-black leading-none text-white">{player.overallRating}</b><small className="text-[8px] font-black tracking-[.2em] text-slate-300">RATING</small></span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 pt-16">
              <div className="mb-2 flex items-center gap-1.5 text-[9px] font-black tracking-[.22em] text-white/70"><RarityIcon size={12} /> {rarity.name} PLAYER CARD</div>
              <h3 className="truncate text-3xl font-black leading-none tracking-tight text-white drop-shadow-xl">{player.shortName || player.name}</h3>
              <p className="mt-1 truncate text-xs font-semibold text-slate-300">{player.club} <span className="text-white/30">·</span> {player.nationality}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/15 pt-3">
                {[["PAC", player.stats?.pace], ["SHO", player.stats?.shooting], ["DRI", player.stats?.dribbling]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-slate-950/45 px-2 py-1.5 text-center backdrop-blur"><b className="block text-sm font-black text-white">{value ?? "—"}</b><span className="text-[8px] font-black tracking-[.16em] text-white/50">{label}</span></div>)}
              </div>
            </div>
            <div className="absolute bottom-3 right-3 opacity-60"><Star size={18} className="fill-white/80 text-white/80" /></div>
          </div>
          <div className="relative z-20 flex items-center justify-between gap-2 px-3 py-3.5 sm:px-4">
            <div className="min-w-0"><p className="text-[8px] font-black tracking-[.2em] text-slate-500">CARD VALUE</p><p className={"text-xl font-black " + rarity.price}>{money(player.price)}</p></div>
            <button disabled={owned || inCart} onClick={() => addToCart(player)} className={"flex min-w-32 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black tracking-wide transition disabled:cursor-default " + (owned ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : inCart ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "bg-white text-slate-950 hover:bg-emerald-200")}>
              {owned ? <><Check size={14} /> OWNED</> : inCart ? <><Check size={14} /> IN BASKET</> : <><Plus size={14} /> ADD TO BASKET</>}
            </button>
          </div>
        </article>;
      })}</div>
        : <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-6 text-center"><div><Sparkles className="mx-auto mb-3 text-emerald-300" /><p className="font-bold">{error ? "Market is unavailable" : "No player cards found"}</p><p className="mt-1 text-sm text-slate-500">{error || "Try another rarity, search, or position."}</p></div></div>}

    {user && <section className="mt-12">
      <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-black tracking-[.22em] text-emerald-300">YOUR CLUB</p><h2 className="mt-1 text-2xl font-black">My collection <span className="text-slate-500">({ownedPlayers.length})</span></h2></div></div>
      {ownedPlayers.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{ownedPlayers.map((item) => {
        const player = item.player;
        if (!player || typeof player !== "object") return null;
        const rarity = rarityFor(player.overallRating);
        return <article key={item._id || player._id} className={"flex items-center gap-3 rounded-2xl border bg-slate-900/80 p-3 " + rarity.frame}><img src={getPlayerPortrait(player)} alt="" className="h-14 w-14 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-black">{player.shortName || player.name}</p><p className="truncate text-xs text-slate-500">{player.club} · OVR {player.overallRating}</p><div className="mt-1"><RarityTag rarity={rarity} compact /></div></div><span className="text-[9px] font-black text-emerald-200">OWNED</span></article>;
      })}</div> : <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">Your purchased player cards will appear here.</p>}
    </section>}

    <button onClick={() => setCartOpen(true)} className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-2xl border border-white/20 bg-slate-950/90 px-4 py-3.5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:inset-x-auto sm:right-7 sm:w-72">
      <span className="flex items-center gap-3"><span className="relative grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 text-slate-950"><ShoppingBag size={19} /><span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-slate-950 bg-amber-300 px-1 text-[9px] font-black">{cartPlayers.length}</span></span><span className="text-left"><b className="block text-sm">Open basket</b><span className="block text-xs text-slate-400">{cartPlayers.length ? cartPlayers.length + " cards · " + money(total) : "Your next star belongs here"}</span></span></span><span className="rounded-lg bg-white px-3 py-2 text-[10px] font-black text-slate-950">VIEW</span>
    </button>

    {cartOpen && <div className="fixed inset-0 z-[70]">
      <button aria-label="Close basket" onClick={() => setCartOpen(false)} className="absolute inset-0 h-full w-full cursor-default bg-slate-950/75 backdrop-blur-sm" />
      <aside role="dialog" aria-modal="true" aria-labelledby="basket-title" className="basket-drawer absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-slate-950 shadow-2xl shadow-black/70">
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-emerald-300/15 via-slate-900 to-teal-400/10 p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div><p className="flex items-center gap-2 text-[10px] font-black tracking-[.22em] text-emerald-200"><ShoppingBag size={14} /> FOOTBALL CARD SELL</p><h2 id="basket-title" className="mt-2 text-2xl font-black">Your basket</h2><p className="mt-1 text-sm text-slate-400">Your next legends are one step away.</p></div>
            <button onClick={() => setCartOpen(false)} aria-label="Close basket" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"><X size={19} /></button>
          </div>
          <div className="relative mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/45 p-3"><span className="text-xs font-semibold text-slate-400">Selected cards</span><b className="text-sm text-white">{cartPlayers.length} <span className="font-medium text-slate-500">/ 20 max</span></b></div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {cartPlayers.length ? cartPlayers.map((player) => {
            const rarity = rarityFor(player.overallRating);
            return <article key={player._id} className={"group relative flex gap-3 overflow-hidden rounded-2xl border bg-slate-900/80 p-2.5 " + rarity.frame}>
              <img src={getPlayerPortrait(player)} alt="" className="h-24 w-[4.5rem] rounded-xl object-cover object-top" />
              <div className="min-w-0 flex-1 py-1">
                <div className="mb-2"><RarityTag rarity={rarity} compact /></div>
                <p className="truncate font-black text-white">{player.shortName || player.name}</p><p className="truncate text-xs text-slate-500">{player.club} · OVR {player.overallRating}</p><p className={"mt-1 text-sm font-black " + rarity.price}>{money(player.price)}</p>
              </div>
              <button onClick={() => removeFromCart(player._id)} aria-label={"Remove " + player.name + " from basket"} className="grid h-9 w-9 shrink-0 place-items-center self-center rounded-xl border border-white/5 text-slate-500 transition hover:border-rose-300/20 hover:bg-rose-300/10 hover:text-rose-200"><Trash2 size={16} /></button>
            </article>;
          }) : <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-7 text-center">
            <div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-200"><ShoppingBag size={28} /></span><h3 className="mt-4 font-black text-white">Your basket is waiting</h3><p className="mt-1 max-w-52 text-sm text-slate-500">Find a rare card and make it yours.</p><button onClick={() => setCartOpen(false)} className="mt-4 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-emerald-200">EXPLORE PLAYER CARDS</button></div>
          </div>}
        </div>

        <div className="border-t border-white/10 bg-slate-900/80 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between text-sm"><span className="text-slate-400">Cards subtotal</span><span className="font-bold text-white">{money(total)}</span></div>
          <div className="mb-4 rounded-xl border border-white/5 bg-slate-950/70 p-3">
            <div className="mb-2 flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-slate-400"><WalletCards size={14} /> Club wallet</span><b className={user?.walletUnlimited || total <= walletBalance ? "text-emerald-300" : "text-rose-300"}>{user?.walletUnlimited ? "UNLIMITED" : user ? money(walletBalance) : "SIGN IN TO VIEW"}</b></div>
            {user && !user.walletUnlimited && <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={"h-full rounded-full transition-all " + (total > walletBalance ? "bg-rose-400" : "bg-emerald-300")} style={{ width: Math.min(100, walletBalance > 0 ? total / walletBalance * 100 : 0) + "%" }} /></div>}
          </div>
          {user && !user.walletUnlimited && total > walletBalance && cartPlayers.length > 0 && <p className="mb-3 text-xs text-rose-300">Your wallet needs {money(total - walletBalance)} more for these cards.</p>}
          <button onClick={checkout} disabled={checkingOut || !cartPlayers.length || (user && !user.walletUnlimited && total > walletBalance)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
            {checkingOut ? <><LoaderCircle className="animate-spin" size={17} /> PROCESSING</> : !user ? <><CreditCard size={17} /> SIGN IN TO CHECK OUT</> : <><CreditCard size={17} /> BUY PLAYER CARDS</>}
          </button>
          <p className="mt-3 text-center text-[10px] leading-4 text-slate-500">Wallet payment is confirmed securely by the shop API.</p>
        </div>
      </aside>
    </div>}
  </section>;
}
