import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, setToken } from "./api";
import { rupee, useApp } from "./store";

function adminApi(path, opts) {
  return api(path, opts);
}

export function AdminLogin() {
  const { user, setUser, authReady } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "admin@bankimahotsav.com", password: "admin123" });
  const [err, setErr] = useState("");
  if (!authReady) return <p className="page wrap">Loading…</p>;
  if (user?.role === "admin") return <Navigate to="/" replace />;
  return (
    <div className="page wrap">
      <h1>Admin Login</h1>
      <form className="card" style={{ maxWidth: 420 }} onSubmit={async (e) => {
        e.preventDefault();
        try {
          const data = await adminApi("/api/admin/login", { method: "POST", body: JSON.stringify(form) });
          setToken(data.token);
          setUser(data.user);
          nav("/");
        } catch (e2) { setErr(e2.message); }
      }}>
        <div className="field"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="field"><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        {err && <p className="err">{err}</p>}
        <button className="btn-red">Enter admin panel</button>
      </form>
    </div>
  );
}

function Guard({ children }) {
  const { user, authReady } = useApp();
  if (!authReady) return <p className="page wrap">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/login" replace />;
  return children;
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminApi("/api/admin/stats").then(setStats); }, []);
  if (!stats) return <p>Loading…</p>;
  const items = [
    ["Pujas", stats.pujas],
    ["Products", stats.products],
    ["Bookings", stats.bookings],
    ["Pending bookings", stats.pendingBookings],
    ["Orders", stats.orders],
    ["Pending orders", stats.pendingOrders],
    ["Reviews", stats.reviews],
    ["Messages", stats.messages],
  ];
  return (
    <>
      <h1>Dashboard</h1>
      <div className="stats">
        {items.map(([k, v]) => <div className="stat" key={k}><span>{k}</span><b>{v}</b></div>)}
      </div>
    </>
  );
}

function SettingsEditor() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { adminApi("/api/admin/settings").then(setS); }, []);
  if (!s) return <p>Loading…</p>;
  const fields = ["siteName", "tagline", "priestName", "priestFather", "phone", "email", "whatsapp", "address", "welcomeTitle", "welcomeSubtitle", "heroImage"];
  return (
    <>
      <h1>Site settings</h1>
      <form className="card" onSubmit={async (e) => {
        e.preventDefault();
        const next = { ...s, disclaimer: String(s.disclaimerText || "").split("\n").filter(Boolean) };
        delete next.disclaimerText;
        await adminApi("/api/admin/settings", { method: "PUT", body: JSON.stringify(next) });
        setMsg("Saved");
      }}>
        {fields.map((k) => (
          <div className="field" key={k}><label>{k}</label><input value={s[k] || ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></div>
        ))}
        <div className="field"><label>about</label><textarea rows={4} value={s.about || ""} onChange={(e) => setS({ ...s, about: e.target.value })} /></div>
        <div className="field"><label>disclaimer (one per line)</label>
          <textarea rows={5} value={s.disclaimerText ?? (s.disclaimer || []).join("\n")} onChange={(e) => setS({ ...s, disclaimerText: e.target.value })} />
        </div>
        <button className="btn-red">Save settings</button>
        {msg && <p className="ok">{msg}</p>}
      </form>
    </>
  );
}

function Crud({ col, fields, title, selects = {}, defaults = {}, hint }) {
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);
  async function load() {
    setRows(await adminApi(`/api/admin/${col}`));
  }
  useEffect(() => { load(); }, [col]);

  async function save(e) {
    e.preventDefault();
    if (edit.id) await adminApi(`/api/admin/${col}/${edit.id}`, { method: "PUT", body: JSON.stringify(edit) });
    else await adminApi(`/api/admin/${col}`, { method: "POST", body: JSON.stringify(edit) });
    setEdit(null);
    load();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{title}</h1>
        <button className="btn-red" onClick={() => setEdit({ ...defaults })}>Add</button>
      </div>
      {hint && <p className="muted">{hint}</p>}
      <table className="table">
        <thead><tr>{fields.slice(0, 4).map((f) => <th key={f}>{f}</th>)}<th /></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {fields.slice(0, 4).map((f) => (
                <td key={f}>
                  {f === "image" && r[f] ? <img src={r[f]} alt="" className="admin-thumb" /> : String(r[f] ?? "").slice(0, 48)}
                </td>
              ))}
              <td className="row-actions">
                <button className="btn-outline" onClick={() => setEdit(r)}>Edit</button>
                <button className="danger" onClick={async () => { if (confirm("Delete?")) { await adminApi(`/api/admin/${col}/${r.id}`, { method: "DELETE" }); load(); } }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="muted">No items yet. Click Add to create one.</p>}
      {edit && (
        <div className="modal-backdrop">
          <form className="modal" style={{ textAlign: "left", width: "min(560px, 100%)" }} onSubmit={save}>
            <button type="button" className="close-x" onClick={() => setEdit(null)}>×</button>
            <h2>{edit.id ? "Edit" : "Add"}</h2>
            {fields.map((f) => (
              <div className="field" key={f}>
                <label>{f}</label>
                {f === "image" ? (
                  <ImageField value={edit[f] || ""} onChange={(url) => setEdit({ ...edit, image: url })} />
                ) : f === "description" || f === "body" || f === "excerpt" || f === "text" || f === "highlights" || f === "rituals" ? (
                  <textarea rows={4} value={edit[f] || ""} onChange={(e) => setEdit({ ...edit, [f]: e.target.value })} />
                ) : f === "consecrated" || f === "featured" || f === "approved" ? (
                  <select value={String(!!edit[f])} onChange={(e) => setEdit({ ...edit, [f]: e.target.value === "true" })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : selects[f] ? (
                  <select value={edit[f] || selects[f][0]} onChange={(e) => setEdit({ ...edit, [f]: e.target.value })}>
                    {selects[f].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input value={edit[f] ?? ""} onChange={(e) => setEdit({ ...edit, [f]: f === "price" || f === "stock" || f === "order" || f === "rating" ? Number(e.target.value) : e.target.value })} />
                )}
              </div>
            ))}
            <button className="btn-red">Save</button>
          </form>
        </div>
      )}
    </>
  );
}

function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      {value ? <img src={value} alt="" className="admin-thumb-lg" /> : null}
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setErr("");
          try {
            const fd = new FormData();
            fd.append("file", file);
            const data = await adminApi("/api/admin/upload", { method: "POST", body: fd });
            onChange(data.url);
          } catch (ex) {
            setErr(ex.message);
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <input placeholder="or paste image URL" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      {busy && <small>Uploading…</small>}
      {err && <p className="err">{err}</p>}
    </div>
  );
}

function StatusTable({ col, title }) {
  const [rows, setRows] = useState([]);
  async function load() { setRows(await adminApi(`/api/admin/${col}`)); }
  useEffect(() => { load(); }, [col]);
  return (
    <>
      <h1>{title}</h1>
      <table className="table">
        <thead><tr><th>When</th><th>Name</th><th>Detail</th><th>Status</th><th /></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
              <td>{r.name}<br /><small>{r.phone}</small></td>
              <td>{r.pujaTitle || r.items?.map((i) => `${i.title}×${i.qty}`).join(", ") || r.message} {r.total ? ` · ${rupee(r.total)}` : r.amount ? ` · ${rupee(r.amount)}` : ""}</td>
              <td>{r.status || (r.read ? "read" : "new")}</td>
              <td>
                {r.status && ["pending", "confirmed", "completed", "cancelled"].map((st) => (
                  <button key={st} className="btn-outline" onClick={async () => { await adminApi(`/api/admin/${col}/${r.id}`, { method: "PUT", body: JSON.stringify({ ...r, status: st }) }); load(); }}>{st}</button>
                ))}
                {col === "messages" && (
                  <button className="btn-outline" onClick={async () => { await adminApi(`/api/admin/messages/${r.id}`, { method: "PUT", body: JSON.stringify({ ...r, read: true }) }); load(); }}>mark read</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function AdminApp() {
  const { logout } = useApp();
  const citizenUrl = import.meta.env.VITE_CITIZEN_URL || "http://localhost:5173";
  return (
    <Guard>
      <div className="admin-shell">
        <aside className="admin-side">
          <span className="brand-name" style={{ display: "block", marginBottom: 16 }}>Banki Mahotsav</span>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/settings">Site settings</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/events">Festivals</NavLink>
          <NavLink to="/news">News</NavLink>
          <NavLink to="/pujas">Pujas</NavLink>
          <NavLink to="/offerings">Offerings</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
          <NavLink to="/reviews">Reviews</NavLink>
          <NavLink to="/bookings">Bookings</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/messages">Messages</NavLink>
          <a href={citizenUrl} target="_blank" rel="noreferrer" style={{ marginTop: 12 }}>View citizen site</a>
          <button className="btn-yellow" style={{ marginTop: 18 }} onClick={logout}>Logout</button>
        </aside>
        <main className="admin-main">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="settings" element={<SettingsEditor />} />
            <Route path="history" element={<Crud col="history" title="History" fields={["title", "slug", "subtitle", "excerpt", "body", "image", "order"]} />} />
            <Route path="events" element={<Crud col="events" title="Festivals" fields={["title", "slug", "image", "excerpt", "body", "timing", "duration", "footfall", "location", "highlights", "rituals", "startsAt", "endsAt", "cta", "featured"]} defaults={{ title: "", slug: "", image: "", excerpt: "", body: "", timing: "", duration: "", footfall: "", location: "", highlights: "", rituals: "", startsAt: "", endsAt: "", cta: "Learn More", featured: true }} hint="Festivals appear on the citizen Festivals page and their detail pages." />} />
            <Route path="pujas" element={<Crud col="pujas" title="Pujas" fields={["title", "slug", "category", "price", "duration", "description", "image", "featured"]} />} />
            <Route path="offerings" element={<Crud col="offerings" title="Offerings" fields={["title", "slug", "price", "description", "image"]} />} />
            <Route path="news" element={<Crud col="news" title="News & Announcements" fields={["title", "excerpt", "badge"]} selects={{ badge: ["Featured", "Latest", "Urgent"] }} defaults={{ title: "", excerpt: "", badge: "Latest" }} hint="These cards appear on the homepage under News & Announcements." />} />
            <Route path="gallery" element={<Crud col="gallery" title="Gallery" fields={["title", "category", "image", "order"]} selects={{ category: ["Temple", "Festivals", "Deities", "Events"] }} defaults={{ title: "", category: "Temple", image: "", order: 0 }} hint="Photos saved here appear on the citizen Gallery page." />} />
            <Route path="products" element={<Crud col="products" title="Store products" fields={["title", "slug", "price", "category", "stock", "description", "image", "consecrated"]} />} />
            <Route path="reviews" element={<Crud col="reviews" title="Reviews" fields={["name", "rating", "text", "approved"]} />} />
            <Route path="bookings" element={<StatusTable col="bookings" title="Puja bookings" />} />
            <Route path="orders" element={<StatusTable col="orders" title="Store orders" />} />
            <Route path="messages" element={<StatusTable col="messages" title="Contact messages" />} />
          </Routes>
        </main>
      </div>
    </Guard>
  );
}
