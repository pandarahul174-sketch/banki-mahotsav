import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { api, setToken } from "./api";
import { useApp } from "./store";
import { swalConfirm, swalError, swalImage, swalPrompt, swalSuccess, swalToast } from "./swal";

function adminApi(path, opts) {
  return api(path, opts);
}

function prettyLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase());
}

const RICH_FIELDS = new Set(["body", "excerpt"]);

function RichEditor({ value, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || "";
  }, []);

  function run(command, arg) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML || "");
  }

  async function link() {
    const url = await swalPrompt("Link URL", "https://");
    if (url) run("createLink", url);
  }

  return (
    <div className="rich">
      <div className="rich-bar">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run("bold")}><b>B</b></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run("italic")}><i>I</i></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run("underline")}><u>U</u></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run("formatBlock", "h2")}>H2</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run("formatBlock", "h3")}>H3</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run("insertUnorderedList")}>• List</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => run("insertOrderedList")}>1. List</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={link}>Link</button>
      </div>
      <div
        ref={ref}
        className="rich-area"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
      />
    </div>
  );
}

export function AdminLogin() {
  const { user, setUser, authReady } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "admin@bankimahotsav.com", password: "admin123" });
  const [brand, setBrand] = useState(null);
  useEffect(() => {
    api("/api/site")
      .then((d) => setBrand(d.settings || null))
      .catch(() => setBrand(null));
  }, []);
  useEffect(() => {
    const href = brand?.favicon || brand?.logo || "/favicon.svg";
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
    document.title = `${brand?.siteName || "Banki Mahotsav"} Admin`;
  }, [brand]);
  if (!authReady) return <p className="page wrap">Loading…</p>;
  if (user?.role === "admin") return <Navigate to="/" replace />;
  const logo = brand?.logo || "/logo.svg";
  const name = brand?.siteName || "Banki Mahotsav";
  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={async (e) => {
        e.preventDefault();
        try {
          const data = await adminApi("/api/admin/login", { method: "POST", body: JSON.stringify(form) });
          setToken(data.token);
          setUser(data.user);
          swalToast("Signed in");
          nav("/");
        } catch (e2) {
          await swalError("Sign in failed", e2.message);
        }
      }}>
        <div className="login-brand">
          <img className="login-logo" src={logo} alt="" />
          <p className="login-kicker">{name}</p>
          <h1>Admin</h1>
        </div>
        <div className="field"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="username" /></div>
        <div className="field"><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /></div>
        <button className="btn-red">Sign in</button>
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

export function Dashboard() {
  const { user } = useApp();
  const [data, setData] = useState(null);
  useEffect(() => {
    Promise.all([
      adminApi("/api/admin/stats"),
      adminApi("/api/admin/events"),
      adminApi("/api/admin/books"),
      adminApi("/api/admin/gallery"),
      adminApi("/api/admin/messages"),
    ]).then(([stats, events, books, gallery, messages]) => {
      setData({ stats, events, books, gallery, messages });
    }).catch(() => setData({ stats: { events: 0, books: 0, gallery: 0, messages: 0 }, events: [], books: [], gallery: [], messages: [] }));
  }, []);
  if (!data) return <p>Loading…</p>;

  const published = (rows) => (rows || []).filter((r) => r.active !== false).length;
  const unread = data.messages.filter((m) => !m.read).length;
  const recent = data.messages.slice(0, 6);
  const kpis = [
    { key: "Events", value: data.stats.events, sub: `${published(data.events)} published on the site`, to: "/events", icon: "events", tone: "saffron" },
    { key: "Books", value: data.stats.books, sub: `${published(data.books)} available to download`, to: "/books", icon: "books", tone: "teal" },
    { key: "Gallery", value: data.stats.gallery, sub: `${published(data.gallery)} photos visible publicly`, to: "/gallery", icon: "gallery", tone: "gold" },
    { key: "Messages", value: data.stats.messages, sub: unread ? `${unread} unread ${unread === 1 ? "enquiry" : "enquiries"}` : "Inbox is up to date", to: "/messages", icon: "messages", tone: "maroon" },
  ];
  const health = [
    { label: "Events", live: published(data.events), total: data.events.length, tone: "saffron" },
    { label: "Books", live: published(data.books), total: data.books.length, tone: "teal" },
    { label: "Gallery", live: published(data.gallery), total: data.gallery.length, tone: "gold" },
  ];
  const actions = [
    { to: "/events", label: "Manage events", icon: "events" },
    { to: "/books", label: "Manage books", icon: "books" },
    { to: "/gallery", label: "Update gallery", icon: "gallery" },
    { to: "/messages", label: "Open inbox", icon: "messages" },
    { to: "/settings", label: "Site settings", icon: "settings" },
    { to: "/footer", label: "Edit footer", icon: "footer" },
  ];

  function when(d) {
    try {
      return new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  return (
    <div className="dash-page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome{user?.name ? `, ${user.name}` : ""}. A snapshot of temple website content and enquiries.</p>
        </div>
      </div>
      <div className="kpi-row">
        {kpis.map((it) => (
          <NavLink className={`kpi kpi-${it.tone}`} to={it.to} key={it.key}>
            <span className="kpi-top">
              <span className="kpi-label">{it.key}</span>
              <span className="kpi-ico"><SideIcon name={it.icon} /></span>
            </span>
            <b>{it.value}</b>
            <em>{it.sub}</em>
          </NavLink>
        ))}
      </div>
      <div className="dash-body">
        <section className="dash-panel">
          <div className="dash-panel-h">
            <div>
              <h2>Recent enquiries</h2>
              <p>{unread ? `${unread} waiting for a reply` : "Latest messages from the contact form"}</p>
            </div>
            <NavLink to="/messages">View all</NavLink>
          </div>
          {recent.length === 0 ? (
            <p className="dash-empty">No messages yet.</p>
          ) : (
            <ul className="dash-msgs">
              {recent.map((m) => (
                <li key={m.id} className={m.read ? "" : "is-new"}>
                  <span className="dash-msg-dot" />
                  <div>
                    <strong>{m.name || "Visitor"}</strong>
                    <small>{when(m.createdAt)}</small>
                    <p>{m.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="dash-side">
          <section className="dash-panel">
            <div className="dash-panel-h">
              <div>
                <h2>Published content</h2>
                <p>What visitors can see on the public site</p>
              </div>
            </div>
            <ul className="dash-health">
              {health.map((h) => (
                <li key={h.label}>
                  <span>
                    {h.label}
                    <b>{h.live}/{h.total || 0}</b>
                  </span>
                  <i className={`dash-bar dash-bar-${h.tone}`}>
                    <i style={{ width: `${h.total ? Math.round((h.live / h.total) * 100) : 0}%` }} />
                  </i>
                </li>
              ))}
            </ul>
          </section>
          <section className="dash-panel">
            <div className="dash-panel-h">
              <div>
                <h2>Quick actions</h2>
                <p>Jump to a section</p>
              </div>
            </div>
            <div className="dash-actions">
              {actions.map((a) => (
                <NavLink key={a.to} to={a.to}>
                  <SideIcon name={a.icon} />
                  {a.label}
                </NavLink>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function SettingsEditor() {
  const [s, setS] = useState(null);
  useEffect(() => { adminApi("/api/admin/settings").then(setS); }, []);
  if (!s) return <p>Loading…</p>;
  const fields = [
    ["siteName", "Site name"],
    ["tagline", "Tagline"],
    ["priestName", "Committee / priest name"],
    ["priestFather", "Seva line"],
    ["phone", "Phone"],
    ["email", "Email"],
    ["contactEmail", "Contact Us inbox"],
    ["whatsapp", "WhatsApp"],
    ["address", "Address"],
    ["aboutDarshan", "Opening hours"],
    ["welcomeTitle", "Homepage title"],
    ["welcomeSubtitle", "Homepage subtitle"],
  ];
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Site settings</h1>
          <p>These details appear in the header, footer, homepage hero, and contact page.</p>
        </div>
      </div>
      <form className="card" onSubmit={async (e) => {
        e.preventDefault();
        try {
          const next = { ...s, disclaimer: String(s.disclaimerText || "").split("\n").filter(Boolean) };
          delete next.disclaimerText;
          await adminApi("/api/admin/settings", { method: "PUT", body: JSON.stringify(next) });
          await swalSuccess("Settings saved", "The public site will show these details after a refresh.");
        } catch (ex) {
          await swalError("Could not save settings", ex.message);
        }
      }}>
        <div className="settings-grid">
          {fields.map(([k, label]) => (
            <div className={`field${k === "address" || k === "contactEmail" ? " span-2" : ""}`} key={k}>
              <label>{label}</label>
              <input
                type={k === "email" || k === "contactEmail" ? "email" : "text"}
                value={s[k] || ""}
                onChange={(e) => setS({ ...s, [k]: e.target.value })}
                placeholder={k === "contactEmail" ? "Messages from Contact Us are emailed here" : undefined}
              />
            </div>
          ))}
          <div className="field">
            <label>Site logo</label>
            <ImageField value={s.logo || ""} onChange={(url) => setS({ ...s, logo: url })} />
          </div>
          <div className="field">
            <label>Favicon</label>
            <ImageField value={s.favicon || ""} onChange={(url) => setS({ ...s, favicon: url })} accept=".ico,.png,.svg,.webp,image/*" />
          </div>
          <div className="field span-2">
            <label>Homepage hero image</label>
            <ImageField value={s.heroImage || ""} onChange={(url) => setS({ ...s, heroImage: url })} />
          </div>
          <div className="field span-2">
            <label>Disclaimer (one line per item)</label>
            <textarea rows={5} value={s.disclaimerText ?? (s.disclaimer || []).join("\n")} onChange={(e) => setS({ ...s, disclaimerText: e.target.value })} />
          </div>
        </div>
        <button className="btn-red">Save settings</button>
      </form>
      <PasswordForm />
    </>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  return (
    <form
      className="card"
      style={{ marginTop: 18 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
          await swalError("Passwords do not match", "Enter the same new password in both fields.");
          return;
        }
        try {
          await adminApi("/api/admin/password", {
            method: "PUT",
            body: JSON.stringify({
              currentPassword: form.currentPassword,
              newPassword: form.newPassword,
            }),
          });
          setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
          await swalSuccess("Password updated", "Use the new password the next time you sign in.");
        } catch (ex) {
          await swalError("Could not update password", ex.message);
        }
      }}
    >
      <h2 className="card-title">Account password</h2>
      <p className="card-hint">Change the password used to sign in to this admin panel.</p>
      <div className="settings-grid">
        <div className="field span-2">
          <label>Current password</label>
          <input type="password" required autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </div>
        <div className="field">
          <label>New password</label>
          <input type="password" required minLength={8} autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input type="password" required minLength={8} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        </div>
      </div>
      <button className="btn-red" type="submit">Update password</button>
    </form>
  );
}

const FOOTER_PAGES = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Events", path: "/events" },
  { label: "Books", path: "/books" },
  { label: "Gallery", path: "/gallery" },
  { label: "Contact", path: "/contact" },
];

function defaultFooterLinks() {
  return FOOTER_PAGES.filter((p) => p.path !== "/").map(({ label, path }) => ({ label, path }));
}

export function FooterSettings() {
  const [s, setS] = useState(null);
  useEffect(() => { adminApi("/api/admin/settings").then(setS); }, []);
  if (!s) return <p>Loading…</p>;
  const links = Array.isArray(s.footerLinks) && s.footerLinks.length ? s.footerLinks : defaultFooterLinks();
  function setLinks(next) {
    setS({ ...s, footerLinks: next });
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Footer</h1>
          <p>This content appears at the bottom of every public page.</p>
        </div>
      </div>
      <form className="card" onSubmit={async (e) => {
        e.preventDefault();
        try {
          const footerLinks = links.filter((l) => (l.label || "").trim());
          await adminApi("/api/admin/settings", { method: "PUT", body: JSON.stringify({ ...s, footerLinks }) });
          await swalSuccess("Footer saved", "The public site will show this footer after a refresh.");
        } catch (ex) {
          await swalError("Could not save footer", ex.message);
        }
      }}>
        <div className="settings-grid">
          <div className="field">
            <label>Title</label>
            <input value={s.footerTitle || ""} onChange={(e) => setS({ ...s, footerTitle: e.target.value })} placeholder="Banki Mahotsav" />
          </div>
          <div className="field">
            <label>About text</label>
            <input value={s.footerAbout || ""} onChange={(e) => setS({ ...s, footerAbout: e.target.value })} placeholder="Maa Charchika · Banki, Odisha" />
          </div>
          <div className="field span-2">
            <label>Address</label>
            <input value={s.footerAddress || ""} onChange={(e) => setS({ ...s, footerAddress: e.target.value })} placeholder="Charchika Temple Road, Banki" />
          </div>
          <div className="field">
            <label>Links heading</label>
            <input value={s.footerLinksTitle || ""} onChange={(e) => setS({ ...s, footerLinksTitle: e.target.value })} placeholder="Quick Links" />
          </div>
          <div className="field">
            <label>Contact heading</label>
            <input value={s.footerContactTitle || ""} onChange={(e) => setS({ ...s, footerContactTitle: e.target.value })} placeholder="Contact" />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={s.footerPhone || ""} onChange={(e) => setS({ ...s, footerPhone: e.target.value })} placeholder="+91 9876543210" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={s.footerEmail || ""} onChange={(e) => setS({ ...s, footerEmail: e.target.value })} placeholder="info@bankimahotsav.com" />
          </div>
          <div className="field span-2">
            <label>Quick links</label>
            <div className="link-editor">
              {links.map((item, i) => (
                <div className="link-row" key={i}>
                  <input
                    placeholder="Label"
                    value={item.label || ""}
                    onChange={(e) => {
                      const next = links.map((row, idx) => idx === i ? { ...row, label: e.target.value } : row);
                      setLinks(next);
                    }}
                  />
                  <select
                    value={FOOTER_PAGES.some((p) => p.path === item.path) ? item.path : "custom"}
                    onChange={(e) => {
                      const path = e.target.value === "custom" ? (item.path || "/about") : e.target.value;
                      const match = FOOTER_PAGES.find((p) => p.path === path);
                      const next = links.map((row, idx) => idx === i ? { ...row, path, label: row.label || match?.label || "" } : row);
                      setLinks(next);
                    }}
                  >
                    {FOOTER_PAGES.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}
                    <option value="custom">Custom URL</option>
                  </select>
                  {!FOOTER_PAGES.some((p) => p.path === item.path) && (
                    <input
                      placeholder="/page or https://"
                      value={item.path || ""}
                      onChange={(e) => {
                        const next = links.map((row, idx) => idx === i ? { ...row, path: e.target.value } : row);
                        setLinks(next);
                      }}
                    />
                  )}
                  <button type="button" className="danger" onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>Remove</button>
                </div>
              ))}
              <button type="button" className="btn-outline" onClick={() => setLinks([...links, { label: "", path: "/about" }])}>Add link</button>
            </div>
          </div>
          <div className="field span-2">
            <label>Copyright</label>
            <input
              value={s.copyright || ""}
              onChange={(e) => setS({ ...s, copyright: e.target.value })}
              placeholder="© 2026 Banki Mahotsav. All rights reserved."
            />
          </div>
        </div>
        <button className="btn-red">Save footer</button>
      </form>
    </>
  );
}

export function AboutSettings() {
  const [s, setS] = useState(null);
  useEffect(() => { adminApi("/api/admin/settings").then(setS); }, []);
  if (!s) return <p>Loading…</p>;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>About page</h1>
          <p>This content appears on the public About page.</p>
        </div>
      </div>
      <form className="card" onSubmit={async (e) => {
        e.preventDefault();
        try {
          await adminApi("/api/admin/settings", { method: "PUT", body: JSON.stringify(s) });
          await swalSuccess("About page saved", "The public About page will update after a refresh.");
        } catch (ex) {
          await swalError("Could not save About page", ex.message);
        }
      }}>
        <div className="settings-grid">
          <div className="field span-2">
            <label>Photo</label>
            <ImageField value={s.aboutImage || ""} onChange={(url) => setS({ ...s, aboutImage: url })} />
          </div>
          <div className="field">
            <label>Eyebrow</label>
            <input value={s.aboutEyebrow || ""} onChange={(e) => setS({ ...s, aboutEyebrow: e.target.value })} placeholder="Adi Shakti Peetha" />
          </div>
          <div className="field">
            <label>Title</label>
            <input value={s.aboutTitle || ""} onChange={(e) => setS({ ...s, aboutTitle: e.target.value })} placeholder="Maa Charchika Temple" />
          </div>
          <div className="field span-2">
            <label>Lead</label>
            <textarea rows={3} value={s.aboutLead || ""} onChange={(e) => setS({ ...s, aboutLead: e.target.value })} placeholder="Short introduction under the title" />
          </div>
          <div className="field span-2">
            <label>About text</label>
            <RichEditor value={s.about || ""} onChange={(html) => setS({ ...s, about: html })} />
          </div>
          <div className="field">
            <label>Darshan hours</label>
            <input value={s.aboutDarshan || ""} onChange={(e) => setS({ ...s, aboutDarshan: e.target.value })} placeholder="6:00 AM – 9:00 PM" />
          </div>
          <div className="field">
            <label>Hill shrine</label>
            <input value={s.aboutHill || ""} onChange={(e) => setS({ ...s, aboutHill: e.target.value })} placeholder="Ruchika Parvata, Banki" />
          </div>
        </div>
        <button className="btn-red">Save about page</button>
      </form>
    </>
  );
}

function Crud({ col, fields, title, selects = {}, defaults = {}, hint }) {
  const loc = useLocation();
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);
  async function load() {
    setRows(await adminApi(`/api/admin/${col}`));
  }
  useEffect(() => { load(); }, [col]);

  useEffect(() => {
    setEdit(null);
  }, [col, loc.pathname, loc.key]);

  useEffect(() => {
    function showList() { setEdit(null); }
    window.addEventListener("admin:show-list", showList);
    return () => window.removeEventListener("admin:show-list", showList);
  }, []);

  useEffect(() => {
    if (!edit) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") setEdit(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [edit]);

  async function save(e) {
    e.preventDefault();
    try {
      if (edit.id) await adminApi(`/api/admin/${col}/${edit.id}`, { method: "PUT", body: JSON.stringify(edit) });
      else await adminApi(`/api/admin/${col}`, { method: "POST", body: JSON.stringify(edit) });
      setEdit(null);
      await load();
      await swalSuccess(edit.id ? "Changes saved" : "Item added", `${title} list has been updated.`);
    } catch (ex) {
      await swalError("Could not save", ex.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {hint && <p>{hint}</p>}
        </div>
        <button className="btn-red" onClick={() => setEdit({ ...defaults, active: true })}>Add new</button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr>{fields.slice(0, 4).map((f) => <th key={f}>{prettyLabel(f)}</th>)}<th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.active === false ? "row-inactive" : ""}>
                {fields.slice(0, 4).map((f) => (
                  <td key={f}>
                    {f === "image" && r[f] ? (
                      <button type="button" className="img-preview-btn" onClick={() => swalImage(r[f], r.title)} aria-label="View image">
                        <img src={r[f]} alt={r.title || ""} className="admin-thumb" />
                      </button>
                    ) : String(r[f] ?? "").slice(0, 48)}
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    className={`status-toggle ${r.active !== false ? "is-on" : "is-off"}`}
                    onClick={async () => {
                      const nextActive = r.active === false;
                      const ok = await swalConfirm({
                        title: nextActive ? "Activate this item?" : "Deactivate this item?",
                        text: nextActive
                          ? "It will appear on the public site."
                          : "It will stay in admin but be hidden on the public site.",
                        confirmText: nextActive ? "Activate" : "Deactivate",
                        destructive: !nextActive,
                      });
                      if (!ok) return;
                      try {
                        await adminApi(`/api/admin/${col}/${r.id}`, { method: "PUT", body: JSON.stringify({ ...r, active: nextActive }) });
                        await load();
                        swalToast(nextActive ? "Marked active" : "Marked inactive");
                      } catch (ex) {
                        await swalError("Could not update status", ex.message);
                      }
                    }}
                  >
                    <span className="status-dot" />
                    {r.active !== false ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="row-actions">
                  <button className="btn-outline" onClick={() => setEdit({ ...r, active: r.active !== false })}>Edit</button>
                  <button className="danger" onClick={async () => {
                    const ok = await swalConfirm({
                      title: "Delete this item?",
                      text: "This cannot be undone.",
                      confirmText: "Delete",
                      destructive: true,
                    });
                    if (!ok) return;
                    try {
                      await adminApi(`/api/admin/${col}/${r.id}`, { method: "DELETE" });
                      await load();
                      swalToast("Deleted");
                    } catch (ex) {
                      await swalError("Could not delete", ex.message);
                    }
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="muted">No items yet. Use Add to create the first one.</p>}
      {edit && (
        <div className="editor-page">
          <form className="editor-form" onSubmit={save}>
            <header className="editor-bar">
              <p>{title}</p>
              <h2>{edit.id ? "Edit" : "Add"} {title.toLowerCase()}</h2>
            </header>
            <div className="editor-scroll">
              <div className="editor-grid">
                {fields.filter((f) => !RICH_FIELDS.has(f)).map((f) => (
                  <div className={`field${f === "image" || f === "pdf" || f === "highlights" || f === "rituals" ? " span-2" : ""}`} key={f}>
                    <label>{prettyLabel(f)}</label>
                    {f === "image" ? (
                      <ImageField value={edit[f] || ""} onChange={(url) => setEdit({ ...edit, image: url })} />
                    ) : f === "pdf" ? (
                      <FileField value={edit[f] || ""} accept="application/pdf,.pdf" onChange={(url) => setEdit({ ...edit, pdf: url })} />
                    ) : f === "highlights" || f === "rituals" ? (
                      <textarea rows={3} value={edit[f] || ""} onChange={(e) => setEdit({ ...edit, [f]: e.target.value })} />
                    ) : f === "active" ? (
                      <select value={String(edit[f] !== false)} onChange={(e) => setEdit({ ...edit, [f]: e.target.value === "true" })}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    ) : f === "featured" ? (
                      <select value={String(!!edit[f])} onChange={(e) => setEdit({ ...edit, [f]: e.target.value === "true" })}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : selects[f] ? (
                      <select value={edit[f] || selects[f][0]} onChange={(e) => setEdit({ ...edit, [f]: e.target.value })}>
                        {selects[f].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input value={edit[f] ?? ""} onChange={(e) => setEdit({ ...edit, [f]: f === "order" ? Number(e.target.value) : e.target.value })} />
                    )}
                  </div>
                ))}
                {fields.filter((f) => RICH_FIELDS.has(f)).map((f) => (
                  <div className="field span-all" key={f}>
                    <label>{prettyLabel(f)}</label>
                    <RichEditor key={`${f}-${edit.id || "new"}`} value={edit[f] || ""} onChange={(html) => setEdit({ ...edit, [f]: html })} />
                  </div>
                ))}
              </div>
            </div>
            <footer className="editor-foot">
              <button type="button" className="btn-outline" onClick={async () => {
                const ok = await swalConfirm({
                  title: "Discard changes?",
                  text: "Unsaved edits will be lost.",
                  confirmText: "Discard",
                  destructive: true,
                  icon: "question",
                });
                if (ok) setEdit(null);
              }}>Cancel</button>
              <button className="btn-red">Save</button>
            </footer>
          </form>
        </div>
      )}
    </>
  );
}

export function EventsPage() {
  return (
    <Crud
      col="events"
      title="Events"
      fields={["title", "slug", "image", "excerpt", "body", "timing", "duration", "footfall", "location", "highlights", "rituals", "startsAt", "endsAt", "cta", "featured", "active"]}
      defaults={{ title: "", slug: "", image: "", excerpt: "", body: "", timing: "", duration: "", footfall: "", location: "", highlights: "", rituals: "", startsAt: "", endsAt: "", cta: "Learn More", featured: true, active: true }}
      hint="Inactive events stay in admin but are hidden on the public site."
    />
  );
}

export function BooksPage() {
  return (
    <Crud
      col="books"
      title="Books"
      fields={["title", "slug", "image", "pdf", "author", "publisher", "publishedYear", "language", "category", "pages", "excerpt", "body", "highlights", "featured", "active"]}
      selects={{ category: ["Devotional", "Literature", "History", "Folk arts"] }}
      defaults={{ title: "", slug: "", image: "", pdf: "", author: "", publisher: "", publishedYear: "", language: "Odia", category: "Literature", pages: "", excerpt: "", body: "", highlights: "", featured: true, active: true }}
      hint="Inactive books stay in admin but are hidden on the public site."
    />
  );
}

export function GalleryPage() {
  return (
    <Crud
      col="gallery"
      title="Gallery"
      fields={["title", "category", "image", "order", "active"]}
      selects={{ category: ["Temple", "Festivals", "Deities", "Events"] }}
      defaults={{ title: "", category: "Temple", image: "", order: 0, active: true }}
      hint="Inactive photos stay in admin but are hidden on the public Gallery page."
    />
  );
}

function ImageField({ value, onChange, accept = "image/*" }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      {value ? (
        <button type="button" className="img-preview-btn img-preview-btn-block" onClick={() => swalImage(value)} aria-label="View image">
          <img src={value} alt="" className="admin-thumb-lg" />
        </button>
      ) : null}
      <input
        type="file"
        accept={accept}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            const fd = new FormData();
            fd.append("file", file);
            const data = await adminApi("/api/admin/upload", { method: "POST", body: fd });
            onChange(data.url);
            swalToast("File uploaded");
          } catch (ex) {
            await swalError("Upload failed", ex.message);
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <input placeholder="or paste image URL" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      {busy && <small>Uploading…</small>}
    </div>
  );
}

function FileField({ value, onChange, accept }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      {value ? <a href={value} target="_blank" rel="noreferrer">{value}</a> : null}
      <input
        type="file"
        accept={accept}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            const fd = new FormData();
            fd.append("file", file);
            const data = await adminApi("/api/admin/upload", { method: "POST", body: fd });
            onChange(data.url);
            swalToast("File uploaded");
          } catch (ex) {
            await swalError("Upload failed", ex.message);
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <input placeholder="or paste PDF URL" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      {busy && <small>Uploading…</small>}
    </div>
  );
}

export function MessagesPage() {
  return <StatusTable title="Messages" />;
}

function StatusTable({ title }) {
  const [rows, setRows] = useState([]);
  async function load() { setRows(await adminApi("/api/admin/messages")); }
  useEffect(() => { load(); }, []);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p>Messages submitted from the public Contact page.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Received</th><th>From</th><th>Message</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>{r.name}<br /><small>{r.email || r.phone}</small></td>
                <td>{r.message}</td>
                <td><span className={`badge ${r.read ? "badge-read" : "badge-new"}`}>{r.read ? "Read" : "New"}</span></td>
                <td>
                  {!r.read && (
                    <button className="btn-outline" onClick={async () => {
                      try {
                        await adminApi(`/api/admin/messages/${r.id}`, { method: "PUT", body: JSON.stringify({ ...r, read: true }) });
                        await load();
                        swalToast("Marked as read");
                      } catch (ex) {
                        await swalError("Could not update message", ex.message);
                      }
                    }}>Mark read</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="muted">No messages yet.</p>}
    </>
  );
}

function SideIcon({ name }) {
  const paths = {
    dashboard: "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z",
    events: "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm3 7h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01",
    books: "M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2V4zm0 0v16M16 8H9m7 4H9",
    gallery: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm3 10 3.5-4.5 2.5 3 1.5-2L18 16M9 9h.01",
    settings: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4",
    messages: "M4 6h16v10H7l-3 3V6z",
    about: "M12 3a9 9 0 1 0 .01 0zM12 8h.01M11 12h2v6h-2",
    footer: "M4 5h16v14H4V5zm0 10h16",
    external: "M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6v6M10 14 20 4",
    logout: "M10 17l-1 0a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h1M14 12h8m-3-3 3 3-3 3",
  };
  return (
    <svg className="side-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function MenuLink({ to, end, children }) {
  return (
    <NavLink
      className="side-link"
      to={to}
      end={end}
      onClick={() => window.dispatchEvent(new Event("admin:show-list"))}
    >
      {children}
    </NavLink>
  );
}

export function AdminApp() {
  const { logout, user } = useApp();
  const [brand, setBrand] = useState(null);
  const citizenUrl = import.meta.env.VITE_CITIZEN_URL || "http://localhost:5173";
  useEffect(() => {
    adminApi("/api/admin/settings").then(setBrand).catch(() => setBrand(null));
  }, []);
  useEffect(() => {
    const href = brand?.favicon || brand?.logo || "/favicon.svg";
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
    if (brand?.siteName) document.title = `${brand.siteName} Admin`;
  }, [brand]);
  const logo = brand?.logo || "/logo.svg";
  return (
    <Guard>
      <div className="admin-shell">
        <aside className="admin-side">
          <div className="side-brand">
            <img className="side-logo" src={logo} alt="" />
            <div>
              <strong>{brand?.siteName || "Banki Mahotsav"}</strong>
              <small>Administration</small>
            </div>
          </div>
          <nav className="side-nav">
            <p className="side-label">Main</p>
            <MenuLink to="/" end><SideIcon name="dashboard" />Dashboard</MenuLink>
            <p className="side-label">Content</p>
            <MenuLink to="/events"><SideIcon name="events" />Events</MenuLink>
            <MenuLink to="/books"><SideIcon name="books" />Books</MenuLink>
            <MenuLink to="/gallery"><SideIcon name="gallery" />Gallery</MenuLink>
            <p className="side-label">Manage</p>
            <MenuLink to="/about"><SideIcon name="about" />About</MenuLink>
            <MenuLink to="/footer"><SideIcon name="footer" />Footer</MenuLink>
            <MenuLink to="/settings"><SideIcon name="settings" />Settings</MenuLink>
            <MenuLink to="/messages"><SideIcon name="messages" />Messages</MenuLink>
          </nav>
          <div className="side-foot">
            <a className="side-link" href={citizenUrl} target="_blank" rel="noreferrer"><SideIcon name="external" />Public website</a>
            <div className="side-account">
              <span className="side-avatar">{(user?.name || "A").slice(0, 1)}</span>
              <div>
                <b>{user?.name || "Administrator"}</b>
                <small>{user?.email}</small>
              </div>
            </div>
            <button className="side-link side-logout" type="button" onClick={async () => {
              const ok = await swalConfirm({
                title: "Sign out?",
                text: "You will need to sign in again to manage the site.",
                confirmText: "Sign out",
                icon: "question",
              });
              if (ok) {
                logout();
                swalToast("Signed out");
              }
            }}><SideIcon name="logout" />Sign out</button>
          </div>
        </aside>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </Guard>
  );
}
