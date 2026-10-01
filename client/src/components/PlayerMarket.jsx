import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, CreditCard, LoaderCircle, Minus, Plus, Search, ShoppingBag, Sparkles, Trash2, WalletCards } from "lucide-react";
import { getPlayerPortrait } from "../data/players";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const positions = ["ALL", "FWD", "MID", "DEF", "GK"];
const money = (value) => `$${Number(value || 0).toLocaleString()}`;

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

export default function PlayerMarket({ user, onSignIn, onUserUpdate }) {
  const [players, setPlayers] = useState([]);
  const [ownedPlayers, setOwnedPlayers] = useState([]);
  const [cartIds, setCartIds] = useState(savedCart);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("ALL");
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
    fetch(`${API_URL}/market/players`)
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
    fetch(`${API_URL}/market/mine`, { headers: { Authorization: `Bearer ${localStorage.getItem("footballToken")}` } })
      .then(readResponse)
      .then((data) => { if (active) setOwnedPlayers(data.ownedPlayers || []); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [user?._id]);

  const ownedIds = useMemo(() => new Set(ownedPlayers.map((item) => String(item.player?._id || item.player))), [ownedPlayers]);
  const cartPlayers = useMemo(() => players.filter((player) => cartIds.includes(String(player._id)) && !ownedIds.has(String(player._id))), [players, cartIds, ownedIds]);
  const total = cartPlayers.reduce((sum, player) => sum + player.price, 0);
  const walletBalance = user?.walletBalance ?? 1000;
  const filteredPlayers = players.filter((player) => {
    const matchesPosition = position === "ALL" || player.position === position;
    const searchText = `${player.name} ${player.club} ${player.nationality}`.toLowerCase();
    return matchesPosition && searchText.includes(search.toLowerCase());
  });

  const addToCart = (player) => {
    setNotice("");
    setCartIds((current) => current.includes(String(player._id)) ? current : [...current, String(player._id)]);
  };

  const removeFromCart = (id) => setCartIds((current) => current.filter((item) => item !== String(id)));

  const checkout = async () => {
    if (!user) { onSignIn(); return; }
    if (!cartPlayers.length) return;
    setCheckingOut(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/market/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("footballToken")}`,
        },
        body: JSON.stringify({ playerIds: cartPlayers.map((player) => String(player._id)) }),
      });
      const data = await readResponse(response);
      setOwnedPlayers(data.user?.ownedPlayers || [...data.purchased, ...ownedPlayers]);
      onUserUpdate(data.user);
      setCartIds((current) => current.filter((id) => !cartPlayers.some((player) => String(player._id) === id)));
      setNotice(`Purchase complete. ${data.purchased.length} player card${data.purchased.length === 1 ? "" : "s"} added to your collection.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return <section id="player-market" className="mx-auto max-w-7xl px-4 py-8 sm:px-7 lg:py-10">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black tracking-[.22em] text-cyan-300">PLAYER MARKET</p><h2 className="mt-1 text-3xl font-black">Pick your players</h2><p className="mt-2 text-sm text-slate-400">Add cards to your basket. Buy them with your club wallet and keep them in your collection.</p></div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300"><ShoppingBag size={17} className="text-cyan-300" /> {cartPlayers.length} in basket</div>
    </div>

    {(error || notice) && <div role={error ? "alert" : "status"} className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${error ? "border-rose-300/20 bg-rose-400/10 text-rose-200" : "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"}`}>
      {error ? <CircleAlert size={18} className="mt-0.5 shrink-0" /> : <Check size={18} className="mt-0.5 shrink-0" />}{error || notice}
    </div>}

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          <label className="flex min-w-52 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 text-slate-400"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search player or club" className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500" /></label>
          <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-slate-900 p-1">{positions.map((item) => <button key={item} onClick={() => setPosition(item)} className={`rounded-lg px-3 py-2 text-[10px] font-black tracking-wide transition ${position === item ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-white"}`}>{item}</button>)}</div>
        </div>

        {loading ? <div className="grid min-h-64 place-items-center rounded-2xl border border-white/10 bg-slate-900/60 text-slate-400"><div className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={18} /> Loading player cards…</div></div>
          : filteredPlayers.length ? <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{filteredPlayers.map((player) => {
            const id = String(player._id);
            const inCart = cartIds.includes(id);
            const owned = ownedIds.has(id);
            return <article key={id} className="market-player-card group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-xl hover:shadow-cyan-950/30">
              <div className="relative h-52 overflow-hidden bg-slate-800">
                <img src={getPlayerPortrait(player)} alt={player.name} className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                <span className="absolute left-3 top-3 rounded-lg border border-white/15 bg-slate-950/70 px-2.5 py-1 text-[10px] font-black tracking-widest text-cyan-200">{player.position}</span>
                <span className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-xl border border-amber-200/30 bg-slate-950/75 text-lg font-black text-amber-200">{player.overallRating}</span>
                <div className="absolute inset-x-4 bottom-3"><p className="text-[10px] font-black tracking-[.2em] text-cyan-200">{player.nationality}</p><h3 className="truncate text-2xl font-black drop-shadow">{player.shortName || player.name}</h3><p className="truncate text-xs font-semibold text-slate-300">{player.club}</p></div>
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div><p className="text-[10px] font-bold tracking-widest text-slate-500">CARD PRICE</p><p className="text-xl font-black text-emerald-300">{money(player.price)}</p></div>
                <button disabled={owned || inCart} onClick={() => addToCart(player)} className={`flex min-w-32 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition disabled:cursor-default ${owned ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : inCart ? "border border-cyan-300/20 bg-cyan-300/10 text-cyan-100" : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"}`}>
                  {owned ? <><Check size={15} /> OWNED</> : inCart ? <><Check size={15} /> IN BASKET</> : <><Plus size={15} /> ADD CARD</>}
                </button>
              </div>
            </article>;
          })}</div>
            : <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-6 text-center"><div><Sparkles className="mx-auto mb-3 text-cyan-300" /><p className="font-bold">{error ? "Market is unavailable" : "No player cards found"}</p><p className="mt-1 text-sm text-slate-500">{error || "Try another search or position."}</p></div></div>}
      </div>

      <aside className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 xl:sticky xl:top-24">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-[.2em] text-cyan-300">YOUR BASKET</p><h3 className="mt-1 text-xl font-black">Selected cards</h3></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><ShoppingBag size={19} /></div></div>
        <div className="my-4 max-h-72 space-y-2 overflow-auto pr-1">
          {cartPlayers.length ? cartPlayers.map((player) => <div key={player._id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/60 p-2.5">
            <img src={getPlayerPortrait(player)} alt="" className="h-12 w-12 rounded-lg object-cover" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{player.shortName || player.name}</p><p className="text-xs text-slate-500">OVR {player.overallRating} · {money(player.price)}</p></div>
            <button onClick={() => removeFromCart(player._id)} aria-label={`Remove ${player.name} from basket`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-400/10 hover:text-rose-200"><Trash2 size={15} /></button>
          </div>) : <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-500"><div><ShoppingBag className="mx-auto mb-2 opacity-60" size={20} />Your basket is empty</div></div>}
        </div>
        <div className="space-y-2 border-t border-white/10 pt-4 text-sm"><div className="flex justify-between text-slate-400"><span>Cards</span><span>{cartPlayers.length}</span></div><div className="flex justify-between text-slate-400"><span>Total</span><b className="text-lg text-white">{money(total)}</b></div>
          <div className="flex items-center justify-between rounded-lg bg-slate-950/70 px-3 py-2 text-xs"><span className="flex items-center gap-1.5 text-slate-400"><WalletCards size={14} /> Wallet</span><b className={user?.walletUnlimited || total <= walletBalance ? "text-emerald-300" : "text-rose-300"}>{user?.walletUnlimited ? "UNLIMITED" : user ? money(walletBalance) : "SIGN IN TO VIEW"}</b></div>
        </div>
        {user && !user.walletUnlimited && total > walletBalance && cartPlayers.length > 0 && <p className="mt-3 text-xs text-rose-300">Your wallet needs {money(total - walletBalance)} more for these cards.</p>}
        <button onClick={checkout} disabled={checkingOut || !cartPlayers.length || (user && !user.walletUnlimited && total > walletBalance)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 py-3 font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
          {checkingOut ? <><LoaderCircle className="animate-spin" size={17} /> PROCESSING</> : !user ? <><CreditCard size={17} /> SIGN IN TO CHECK OUT</> : <><CreditCard size={17} /> BUY PLAYER CARDS</>}
        </button>
        <p className="mt-3 text-center text-[10px] leading-4 text-slate-500">Purchases use your in-app wallet. Cards stay in your account collection.</p>
      </aside>
    </div>

    {user && <section className="mt-12">
      <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-black tracking-[.22em] text-emerald-300">YOUR CLUB</p><h2 className="mt-1 text-2xl font-black">My collection <span className="text-slate-500">({ownedPlayers.length})</span></h2></div></div>
      {ownedPlayers.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{ownedPlayers.map((item) => {
        const player = item.player;
        if (!player || typeof player !== "object") return null;
        return <article key={item._id || player._id} className="flex items-center gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-3"><img src={getPlayerPortrait(player)} alt="" className="h-14 w-14 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-black">{player.shortName || player.name}</p><p className="truncate text-xs text-slate-500">{player.club} · OVR {player.overallRating}</p></div><span className="text-xs font-black text-emerald-200">OWNED</span></article>;
      })}</div> : <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">Your purchased player cards will appear here.</p>}
    </section>}
  </section>;
}

