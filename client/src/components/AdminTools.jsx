import { useEffect, useState } from "react";
import { CircleAlert, Clock3, PackagePlus, ReceiptText, ShieldCheck, Users } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const emptyProduct = { name: "", shortName: "", nationality: "", club: "", position: "FWD", overallRating: 80, imageUrl: "" };
const money = (amount) => "$" + Number(amount || 0).toLocaleString();
const fields = "w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50";

async function adminRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("footballToken")}`, ...options.headers },
  });
  const raw = await response.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch (_error) { /* handled by status below */ }
  if (!response.ok) throw new Error(data.message || "Admin request failed.");
  return data;
}

export default function AdminTools() {
  const [tab, setTab] = useState("products");
  const [product, setProduct] = useState(emptyProduct);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    Promise.all([adminRequest("/admin/players"), adminRequest("/admin/purchases")])
      .then(([nextProducts, history]) => { setProducts(nextProducts); setPurchases(history.purchases || []); })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const createProduct = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const created = await adminRequest("/admin/players", { method: "POST", body: JSON.stringify({ ...product, overallRating: Number(product.overallRating) }) });
      setProducts((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setProduct(emptyProduct);
      setNotice(`${created.name} is now for sale at ${money(created.price)}.`);
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: "products", label: "ADD PRODUCT", icon: PackagePlus },
    { id: "purchases", label: `PURCHASE HISTORY (${purchases.length})`, icon: ReceiptText },
  ];

  return <section className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-12 lg:px-10" id="admin-tools">
    <div className="overflow-hidden rounded-3xl border border-emerald-300/20 bg-slate-900/80 shadow-xl shadow-emerald-950/20">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-emerald-300/[.12] via-slate-900 to-slate-900 p-5 sm:p-6">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-300 text-slate-950"><ShieldCheck size={21} /></span><div><p className="text-[10px] font-black tracking-[.2em] text-emerald-200">ADMIN MENU</p><h2 className="text-xl font-black">Store management</h2></div></div>
        <div role="tablist" aria-label="Admin store tools" className="flex max-w-full gap-2 overflow-x-auto">{tabs.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setError(""); setNotice(""); }} className={"flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-black transition sm:px-4 " + (tab === id ? "border-emerald-200/30 bg-emerald-300 text-slate-950" : "border-white/10 bg-slate-950/50 text-slate-400 hover:text-white")}><Icon size={15} />{label}</button>)}</div>
      </div>
      <div className="p-5 sm:p-6">
        {error && <p role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-200"><CircleAlert size={17} />{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{notice}</p>}
        {tab === "products" ? <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
          <form onSubmit={createProduct} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 sm:p-5">
            <div className="mb-4"><p className="flex items-center gap-2 text-xs font-black tracking-[.15em] text-emerald-200"><PackagePlus size={15} /> NEW PLAYER CARD</p><p className="mt-1 text-xs text-slate-500">The card appears in the market immediately. Sale price is rating × $5.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-400">Player name<input className={fields + " mt-1.5"} required minLength="2" maxLength="80" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} placeholder="Player name" /></label>
              <label className="text-xs font-bold text-slate-400">Card display name<input className={fields + " mt-1.5"} maxLength="40" value={product.shortName} onChange={(e) => setProduct({ ...product, shortName: e.target.value })} placeholder="Optional" /></label>
              <label className="text-xs font-bold text-slate-400">Club<input className={fields + " mt-1.5"} required value={product.club} onChange={(e) => setProduct({ ...product, club: e.target.value })} placeholder="Club" /></label>
              <label className="text-xs font-bold text-slate-400">Nationality<input className={fields + " mt-1.5"} required value={product.nationality} onChange={(e) => setProduct({ ...product, nationality: e.target.value })} placeholder="Country" /></label>
              <label className="text-xs font-bold text-slate-400">Position<select className={fields + " mt-1.5"} value={product.position} onChange={(e) => setProduct({ ...product, position: e.target.value })}>{["FWD", "MID", "DEF", "GK"].map((position) => <option key={position}>{position}</option>)}</select></label>
              <label className="text-xs font-bold text-slate-400">Overall rating<input className={fields + " mt-1.5"} required type="number" min="1" max="100" value={product.overallRating} onChange={(e) => setProduct({ ...product, overallRating: e.target.value })} /></label>
              <label className="text-xs font-bold text-slate-400 sm:col-span-2">Card image URL<input className={fields + " mt-1.5"} required type="url" value={product.imageUrl} onChange={(e) => setProduct({ ...product, imageUrl: e.target.value })} placeholder="https://…" /></label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-400">Market price: <b className="text-white">{money(Number(product.overallRating || 0) * 5)}</b></p><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-emerald-200 disabled:opacity-60"><PackagePlus size={15} />{saving ? "ADDING…" : "ADD TO MARKET"}</button></div>
          </form>
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div><h3 className="font-black">Market inventory</h3><p className="text-xs text-slate-500">{products.length} player cards</p></div><Users size={17} className="text-emerald-200" /></div><div className="max-h-[28rem] space-y-2 overflow-auto pr-1">{products.map((item) => <div key={item._id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/70 p-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{item.shortName || item.name}</p><p className="truncate text-xs text-slate-500">{item.club} · OVR {item.overallRating}</p></div><span className="shrink-0 text-xs font-black text-emerald-200">{money(item.overallRating * 5)}</span></div>)}</div></div>
        </div> : <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h3 className="flex items-center gap-2 text-lg font-black"><ReceiptText size={18} className="text-emerald-200" /> All user purchases</h3><p className="mt-1 text-xs text-slate-500">Every completed card purchase, newest first.</p></div><span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-slate-300">{purchases.length} total</span></div>
          <div className="overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-950 text-[10px] font-black tracking-wider text-slate-500"><tr><th className="px-4 py-3">USER</th><th className="px-4 py-3">PLAYER CARD</th><th className="px-4 py-3">PRICE PAID</th><th className="px-4 py-3">PURCHASED</th></tr></thead><tbody className="divide-y divide-white/5">{purchases.map((purchase) => <tr key={purchase._id} className="bg-slate-900/55 hover:bg-slate-800/65"><td className="px-4 py-3"><p className="font-bold text-white">{purchase.user?.displayName || "Unknown user"}</p><p className="text-xs text-slate-500">{purchase.user?.email || ""}</p></td><td className="px-4 py-3"><p className="font-bold text-white">{purchase.player?.shortName || purchase.player?.name || "Removed player"}</p><p className="text-xs text-slate-500">{purchase.player?.club || "Card unavailable"}</p></td><td className="px-4 py-3 font-black text-emerald-200">{money(purchase.pricePaid)}</td><td className="px-4 py-3 text-xs text-slate-400"><span className="flex items-center gap-1.5"><Clock3 size={13} />{purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleString() : "Date unavailable"}</span></td></tr>)}</tbody></table></div>
          {!loading && purchases.length === 0 && <div className="py-12 text-center text-sm text-slate-500">No purchases have been completed yet.</div>}
        </div>}
      </div>
    </div>
  </section>;
}
