import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, setToken } from "./api";
import { useApp } from "./store";
import { PageHero, rupee } from "./Layout";

function chips(value) {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  return String(value || "").split(/[,|\n]/).map((s) => s.trim()).filter(Boolean);
}

export function Home() {
  const { site } = useApp();
  if (!site) return <div className="wrap page">Loading...</div>;
  const event = site.events.find((e) => e.featured) || site.events[0];
  const hero = site.settings.heroImage && !String(site.settings.heroImage).endsWith(".svg")
    ? site.settings.heroImage
    : "https://images.unsplash.com/photo-1582510003544-4d00b7f74286?auto=format&fit=crop&w=2000&q=80";

  return (
    <>
      <section className="hero-full" style={{ backgroundImage: `url(${hero})` }}>
        <div className="hero-overlay" />
        <div className="hero-copy">
          <p className="mantra">|| Om Charchika Namah ||</p>
          <h1>Maa Charchika Temple</h1>
          <p className="hero-lead">One of the most revered Adi Shakti Peethas of Odisha</p>
          <p className="hero-desc">
            Located at Banki in Cuttack district, this sacred shrine on Ruchika Parvata is dedicated to the divine worship of Maa Charchika. {site.settings.about?.slice(0, 120)}
          </p>
          <div className="hero-chips">
            <span>Open 6:00 AM - 9:00 PM</span>
            <span>{event ? `${event.title} - ${event.startsAt}` : "Banki Mahotsav"}</span>
          </div>
          <div className="hero-ctas">
            <Link className="btn-donate" to="/pujas">Darshan Timings</Link>
          </div>
        </div>
      </section>

      <section className="home-fests">
        <div className="wrap">
          <h2>Festivals & Events</h2>
          <p className="home-fests-lead">Upcoming festivals and celebrations throughout the year at Charchika Temple</p>
          <div className="mosaic">
            {[...site.events].filter((ev) => ev.image).sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 4).map((ev) => (
              <Link className="fest-tile" key={ev.id} to={`/festivals/${ev.slug}`}>
                <img src={ev.image || "/festival.svg"} alt="" />
                <div className="fest-shade">
                  {ev.featured && <span className="feat-pill">Featured</span>}
                  <h3>{ev.title}</h3>
                  <p>{(ev.excerpt || ev.description || "").slice(0, 90)}</p>
                  <small>{ev.timing || ev.startsAt}{ev.footfall ? ` · ${ev.footfall}` : ""}</small>
                </div>
              </Link>
            ))}
          </div>
          <Link className="btn-fest-all" to="/festivals">View All Festivals</Link>
        </div>
      </section>

      <section className="home-news" id="news">
        <div className="wrap">
          <div className="news-head">
            <div>
              <p className="eyebrow">Announcements</p>
              <h2>News & Announcements</h2>
            </div>
            <Link className="btn-outline" to="#news">View All News</Link>
          </div>
          <div className="news-grid">
            {(site.news || []).slice(0, 3).map((n) => (
              <article className="news-card" key={n.id}>
                <span className={`nb nb-${String(n.badge || "latest").toLowerCase()}`}>{n.badge || "Latest"}</span>
                <h3>{n.title}</h3>
                <p>{n.excerpt}</p>
                <small>{n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap home-temple-gallery">
        <p className="eyebrow" style={{ textAlign: "center" }}>Sacred Moments Captured</p>
        <h2>Temple Gallery</h2>
        <p className="home-g-lead">Explore the divine beauty of Charchika Temple through our collection of photographs</p>
        <div className="home-g-grid">
          {(site.gallery || []).slice(0, 4).map((g) => (
            <Link key={g.id} to="/gallery">
              <img src={g.image} alt={g.title} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
export function HistoryDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  useEffect(() => { api(`/api/history/${slug}`).then(setItem).catch(() => setItem(null)); }, [slug]);
  if (!item) return <PageHero title="History">Loading...</PageHero>;
  return (
    <PageHero title={item.title}>
      <div className="detail">
        <img src={item.image} alt={item.title} />
        <div className="card">
          <p><b>{item.subtitle}</b></p>
          <p>{item.body}</p>
        </div>
      </div>
    </PageHero>
  );
}

export function Pujas() {
  const { site, user } = useApp();
  const [params] = useSearchParams();
  const cat = params.get("cat");
  const list = (site?.pujas || []).filter((p) => !cat || p.category === cat);
  return (
    <PageHero title={cat || "Book Online Puja"}>
      <div className="product-grid">
        {list.map((p) => (
          <article className="product-card" key={p.id}>
            <img src={p.image} alt={p.title} />
            <div className="body">
              <h3 style={{ margin: 0, fontSize: 16 }}>{p.title}</h3>
              <div className="price">{rupee(p.price)}</div>
              <p style={{ fontSize: 13, color: "#6d4a4a" }}>{p.duration}</p>
              <Link className="btn-red" to={`/pujas/${p.slug}`}>Book now</Link>
            </div>
          </article>
        ))}
      </div>
      {!user && <p>Login is optional. You can book as a guest.</p>}
    </PageHero>
  );
}

export function PujaDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user } = useApp();
  const [item, setItem] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", gotra: "", notes: "" });
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api(`/api/pujas/${slug}`).then((p) => {
      setItem(p);
      setForm((f) => ({ ...f, name: user?.name || f.name, email: user?.email || f.email }));
    });
  }, [slug, user]);
  if (!item) return <PageHero title="Puja">Loading...</PageHero>;
  return (
    <PageHero title={item.title}>
      <div className="detail">
        <img src={item.image} alt={item.title} />
        <form className="card" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/bookings", { method: "POST", body: JSON.stringify({ ...form, pujaId: item.id }) });
            setMsg("Booking received. Our seva team will confirm on phone/WhatsApp.");
            setTimeout(() => nav("/pujas"), 1200);
          } catch (err) { setMsg(err.message); }
        }}>
          <p>{item.description}</p>
          <p className="price">{rupee(item.price)} Â· {item.duration}</p>
          {["name", "email", "phone", "date", "gotra"].map((k) => (
            <div className="field" key={k}>
              <label>{k}</label>
              <input type={k === "date" ? "date" : "text"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={k === "name" || k === "phone"} />
            </div>
          ))}
          <div className="field"><label>Notes / sankalp</label><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <button className="btn-red">Confirm booking</button>
          {msg && <p className="ok">{msg}</p>}
        </form>
      </div>
    </PageHero>
  );
}

export function Store() {
  const { site } = useApp();
  return (
    <PageHero title="Store">
      <div className="disclaimer">
        <h4>Consecrated items</h4>
        <p>A consecrated (pratishthit) item is energised through puja before it is sent, so the price is slightly higher than an unconsecrated product.</p>
      </div>
      <div className="product-grid">
        {(site?.products || []).map((p) => (
          <article className="product-card" key={p.id}>
            <img src={p.image} alt={p.title} />
            <div className="body">
              {p.consecrated && <span className="badge-gold">Consecrated</span>}
              <h3 style={{ margin: 0, fontSize: 16 }}>{p.title}</h3>
              <div className="price">{rupee(p.price)}</div>
              <Link className="btn-red" to={`/store/${p.slug}`}>View</Link>
            </div>
          </article>
        ))}
      </div>
    </PageHero>
  );
}

export function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useApp();
  const [item, setItem] = useState(null);
  const nav = useNavigate();
  useEffect(() => { api(`/api/products/${slug}`).then(setItem); }, [slug]);
  if (!item) return <PageHero title="Product">Loading...</PageHero>;
  return (
    <PageHero title={item.title}>
      <div className="detail">
        <img src={item.image} alt={item.title} />
        <div className="card">
          {item.consecrated && <span className="badge-gold">Consecrated</span>}
          <p>{item.description}</p>
          <p className="price">{rupee(item.price)}</p>
          <button className="btn-red" onClick={() => { addToCart(item); nav("/cart"); }}>Add to cart</button>
        </div>
      </div>
    </PageHero>
  );
}

export function Offerings() {
  const { site, addToCart } = useApp();
  const nav = useNavigate();
  return (
    <PageHero title="Offerings">
      <div className="product-grid">
        {(site?.offerings || []).map((p) => (
          <article className="product-card" key={p.id}>
            <img src={p.image} alt={p.title} />
            <div className="body">
              <h3 style={{ margin: 0, fontSize: 16 }}>{p.title}</h3>
              <p style={{ fontSize: 14 }}>{p.description}</p>
              <div className="price">{rupee(p.price)}</div>
              <button className="btn-red" onClick={() => { addToCart({ ...p, kind: "offering" }); nav("/cart"); }}>Offer now</button>
            </div>
          </article>
        ))}
      </div>
    </PageHero>
  );
}

export function Cart() {
  const { cart, updateQty, clearCart } = useApp();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [msg, setMsg] = useState("");
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <PageHero title="Cart">
      {!cart.length && <p>Your cart is empty.</p>}
      {cart.map((i) => (
        <div className="card" key={i.id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div><b>{i.title}</b><div className="price">{rupee(i.price)}</div></div>
          <input type="number" min="0" value={i.qty} onChange={(e) => updateQty(i.id, Number(e.target.value))} style={{ width: 70 }} />
        </div>
      ))}
      {!!cart.length && (
        <form className="card" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/orders", { method: "POST", body: JSON.stringify({ ...form, items: cart }) });
            clearCart();
            setMsg("Order placed. We will contact you for confirmation.");
          } catch (err) { setMsg(err.message); }
        }}>
          <p><b>Total {rupee(total)}</b></p>
          {["name", "email", "phone", "address"].map((k) => (
            <div className="field" key={k}><label>{k}</label><input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={k !== "email"} /></div>
          ))}
          <button className="btn-red">Place order</button>
          {msg && <p className="ok">{msg}</p>}
        </form>
      )}
    </PageHero>
  );
}

export function Auth() {
  const { setUser } = useApp();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  return (
    <PageHero title={mode === "login" ? "Login" : "Register"}>
      <form className="card" style={{ maxWidth: 420 }} onSubmit={async (e) => {
        e.preventDefault();
        try {
          const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
          const data = await api(path, { method: "POST", body: JSON.stringify(form) });
          setToken(data.token);
          setUser(data.user);
          nav("/");
        } catch (e2) { setErr(e2.message); }
      }}>
        {mode === "register" && <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>}
        <div className="field"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div className="field"><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
        {err && <p className="err">{err}</p>}
        <button className="btn-red">{mode === "login" ? "Login" : "Create account"}</button>
        <button type="button" className="linkish" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
        </button>
        <p style={{ fontSize: 13, color: "#6d4a4a" }}>Demo devotee: devotee@bankimahotsav.com / devotee123</p>
      </form>
    </PageHero>
  );
}

export function About() {
  const { site } = useApp();
  return <PageHero title="About Us"><div className="card"><p>{site?.settings.about}</p></div></PageHero>;
}

export function Festivals() {
  const { site } = useApp();
  const events = [...(site?.events || [])].sort((a, b) => Number(b.featured) - Number(a.featured));
  return (
    <>
      <section className="page-banner">
        <div className="wrap">
          <p className="crumb"><Link to="/">Home</Link> &gt; Festivals</p>
          <h1>Festivals & Celebrations</h1>
          <p>Experience the divine celebrations throughout the year</p>
        </div>
      </section>
      <div className="fest-band">
        <div className="wrap fest-wrap">
          <h2>Major Festivals</h2>
          {events.map((ev) => (
            <article className="fest-card" key={ev.id}>
              <img src={ev.image || "/festival.svg"} alt={ev.title} />
              <div className="fest-body">
                {ev.featured && <span className="feat">Featured</span>}
                <h3>{ev.title}</h3>
                <p>{ev.excerpt || ev.description}</p>
                <div className="fest-meta">
                  {ev.timing && <span>📅 {ev.timing}</span>}
                  {ev.duration && <span>duration: {ev.duration}</span>}
                  {ev.footfall && <span>👥 {ev.footfall}</span>}
                </div>
                {!!chips(ev.highlights).length && (
                  <div className="hl">
                    {chips(ev.highlights).map((h) => <span key={h}>{h}</span>)}
                  </div>
                )}
                <Link className="btn-donate" to={`/festivals/${ev.slug}`}>Learn More →</Link>
              </div>
            </article>
          ))}
          {!events.length && <p>No festivals yet. Add them from the admin Festivals page.</p>}
        </div>
      </div>
    </>
  );
}

export function FestivalDetail() {
  const { slug } = useParams();
  const { site } = useApp();
  const [item, setItem] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    const local = (site?.events || []).find((e) => e.slug === slug);
    if (local) setItem(local);
    api(`/api/events/${slug}`).then(setItem).catch((e) => {
      if (!local) setErr(e.message);
    });
  }, [slug, site]);
  if (err) return <PageHero title="Festival">{err}</PageHero>;
  if (!item) return <PageHero title="Festival">Loading...</PageHero>;
  const overview = item.body || item.description || "";
  const rites = chips(item.rituals);
  return (
    <div className="fest-detail-page">
      <div className="wrap fest-overview">
        <div>
          <h1>Festival Overview</h1>
          {overview.split("\n").filter(Boolean).map((p) => <p key={p}>{p}</p>)}
        </div>
        <div>
          <img className="fest-hero-img" src={item.image || "/festival.svg"} alt={item.title} />
          <div className="quick">
            <h3>Quick information</h3>
            <div className="quick-grid">
              <div><strong>Timing</strong><p>{item.timing || `${item.startsAt} – ${item.endsAt}`}</p></div>
              <div><strong>Duration</strong><p>{item.duration || "—"}</p></div>
              <div><strong>Footfall</strong><p>{item.footfall || "—"}</p></div>
              <div><strong>Location</strong><p>{item.location || site?.settings?.address || "Banki, Odisha"}</p></div>
            </div>
          </div>
        </div>
      </div>
      {!!rites.length && (
        <section className="rituals-band">
          <div className="wrap">
            <h2>Sacred Rituals & Ceremonies</h2>
            <div className="ritual-grid">
              {rites.map((r) => (
                <article className="touch-card" key={r}>
                  <span className="touch-icon" aria-hidden="true">🪔</span>
                  <div><h3>{r}</h3></div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export function Contact() {
  const { site } = useApp();
  const s = site?.settings || {};
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const address = s.address || "Charchika Temple Road, Banki, Cuttack, Odisha 754008";
  const mapsQuery = encodeURIComponent("Charchika Temple Banki Odisha");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const mapEmbed = `https://maps.google.com/maps?q=${mapsQuery}&z=15&output=embed`;

  return (
    <>
      <section className="page-banner">
        <div className="wrap">
          <p className="crumb"><Link to="/">Home</Link> &gt; Contact</p>
          <h1>Contact Us</h1>
          <p>Get in touch with the temple administration</p>
        </div>
      </section>
      <div className="contact-band">
        <div className="wrap contact-layout">
          <div>
            <h2>Get In Touch</h2>
            <div className="touch-grid">
              <article className="touch-card">
                <span className="touch-icon" aria-hidden="true">📍</span>
                <div>
                  <h3>Address</h3>
                  <p>{address}</p>
                </div>
              </article>
              <article className="touch-card">
                <span className="touch-icon" aria-hidden="true">📞</span>
                <div>
                  <h3>Phone</h3>
                  <p><a href={`tel:${s.phone}`}>{s.phone || "+91 9876543210"}</a></p>
                </div>
              </article>
              <article className="touch-card">
                <span className="touch-icon" aria-hidden="true">✉️</span>
                <div>
                  <h3>Email</h3>
                  <p><a href={`mailto:${s.email}`}>{s.email || "info@bankimahotsav.com"}</a></p>
                </div>
              </article>
              <article className="touch-card">
                <span className="touch-icon" aria-hidden="true">🕒</span>
                <div>
                  <h3>Office Hours</h3>
                  <p>Monday – Saturday: 6:00 AM – 9:00 PM<br />Sunday: 6:00 AM – 9:00 PM</p>
                </div>
              </article>
            </div>
            <div className="map-card">
              <a className="map-open" href={mapsUrl} target="_blank" rel="noreferrer">Open in Maps ↗</a>
              <iframe title="Charchika Temple map" src={mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>
          <form className="message-card" onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            setMsg("");
            try {
              const message = form.subject ? `${form.subject}\n\n${form.message}` : form.message;
              await api("/api/contact", { method: "POST", body: JSON.stringify({ ...form, message }) });
              setMsg("Message sent. The temple office will get back to you.");
              setForm({ name: "", email: "", phone: "", subject: "", message: "" });
            } catch (e2) { setErr(e2.message); }
          }}>
            <h2>Send Us a Message</h2>
            <div className="form-2">
              <div className="field">
                <label>Full Name *</label>
                <input placeholder="Enter your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Email Address *</label>
                <input type="email" placeholder="Enter your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label>Phone Number</label>
                <input placeholder="Enter your phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="field">
                <label>Subject *</label>
                <input placeholder="Enter subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
            </div>
            <div className="field">
              <label>Message *</label>
              <textarea rows={6} placeholder="Type your message here..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <button className="btn-send" type="submit">✉ Send Message</button>
            {msg && <p className="ok">{msg}</p>}
            {err && <p className="err">{err}</p>}
          </form>
        </div>
      </div>
    </>
  );
}

export function Gallery() {
  const { site } = useApp();
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(null);
  const items = site?.gallery || [];
  const cats = ["All", "Temple", "Festivals", "Deities", "Events"];
  const shown = items.filter((g) => cat === "All" || g.category === cat);
  const idx = open ? shown.findIndex((g) => g.id === open.id) : -1;

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function showPrev(e) {
    e.stopPropagation();
    if (idx > 0) setOpen(shown[idx - 1]);
  }
  function showNext(e) {
    e.stopPropagation();
    if (idx >= 0 && idx < shown.length - 1) setOpen(shown[idx + 1]);
  }

  return (
    <>
      <section className="page-banner">
        <div className="wrap">
          <p className="crumb"><Link to="/">Home</Link> &gt; Gallery</p>
          <h1>Temple Gallery</h1>
          <p>Explore the divine beauty of Charchika Temple through our collection of photographs</p>
        </div>
      </section>
      <div className="gallery-band">
      <div className="wrap">
        <div className="filters">
          {cats.map((c) => (
            <button key={c} className={`chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="photo-grid">
          {shown.map((g) => (
            <figure key={g.id}>
              <button type="button" className="photo-btn" onClick={() => setOpen(g)}>
                <img src={g.image} alt={g.title} />
              </button>
            </figure>
          ))}
        </div>
        {!shown.length && (
          <p style={{ textAlign: "center", paddingBottom: 48 }}>
            {items.length ? "No photographs in this category yet." : "No photographs yet. Add them from the admin Gallery page."}
          </p>
        )}
      </div>
      </div>
      {open && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={open.title}>
          <button type="button" className="lightbox-close" onClick={() => setOpen(null)} aria-label="Close">×</button>
          {idx > 0 && <button type="button" className="lightbox-nav prev" onClick={showPrev} aria-label="Previous">‹</button>}
          {idx >= 0 && idx < shown.length - 1 && <button type="button" className="lightbox-nav next" onClick={showNext} aria-label="Next">›</button>}
          <figure className="lightbox-fig" onClick={(e) => e.stopPropagation()}>
            <img src={open.image} alt={open.title} />
            <figcaption>{open.title}{open.category ? ` · ${open.category}` : ""}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

export function Policies() {
  return (
    <PageHero title="Policies">
      <div className="card">
        <h3>Return, Refund & Cancellation</h3>
        <p>Puja bookings can be rescheduled up to 24 hours before the chosen date. Consecrated store items are not returnable once dispatched. Unused unconsecrated products may be returned within 7 days if unused and packed.</p>
        <h3>Terms & Privacy</h3>
        <p>Personal details are used only to perform seva, dispatch orders, and communicate booking status. We do not sell devotee data.</p>
      </div>
    </PageHero>
  );
}

export function NotFound() {
  return <PageHero title="404"><p>Page not found.</p><Link className="btn-red" to="/">Go to Homepage</Link></PageHero>;
}
