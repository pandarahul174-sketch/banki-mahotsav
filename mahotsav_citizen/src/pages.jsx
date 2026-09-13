import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./api";
import { useApp } from "./store";
import { PageHero } from "./Layout";
import { swalError, swalSuccess } from "./swal";

function TempleMap() {
  useEffect(() => {
    let map;
    let cancelled = false;
    async function boot() {
      if (!document.getElementById("leaflet-css")) {
        const css = document.createElement("link");
        css.id = "leaflet-css";
        css.rel = "stylesheet";
        css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(css);
      }
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }
      if (cancelled || !window.L) return;
      const el = document.getElementById("temple-map");
      if (!el || el._leaflet_id) return;
      const lat = 20.377257;
      const lng = 85.527682;
      map = window.L.map(el).setView([lat, lng], 16);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      window.L.marker([lat, lng]).addTo(map).bindPopup("Maa Charchika Temple, Banki");
      setTimeout(() => map.invalidateSize(), 250);
    }
    boot().catch(() => {});
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, []);
  return <div id="temple-map" className="temple-map" />;
}

function chips(value) {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  return String(value || "").split(/[,|\n]/).map((s) => s.trim()).filter(Boolean);
}

function plainText(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function RichText({ html }) {
  const text = String(html || "").trim();
  if (!text) return null;
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return <div className="rich-body" dangerouslySetInnerHTML={{ __html: text }} />;
  }
  return text.split("\n").filter(Boolean).map((p) => <p key={p}>{p}</p>);
}

export function Home() {
  const { site } = useApp();
  if (!site) return <div className="wrap page">Loading...</div>;
  const s = site.settings || {};
  const hero = s.heroImage || "/hero.jpg";
  const hours = s.aboutDarshan || "6:00 AM – 9:00 PM";

  return (
    <>
      <section className="hero-full" style={{ backgroundImage: `url("${hero}")` }}>
        <div className="hero-overlay" />
        <div className="hero-copy">
          <p className="mantra">{s.tagline || "|| Om Charchika Namah ||"}</p>
          <h1>{s.welcomeTitle || "Maa Charchika Temple"}</h1>
          <p className="hero-lead">{s.welcomeSubtitle || "Adi Shakti Peetha of Banki, Odisha"}</p>
          <p className="hero-desc">
            {s.aboutLead || "The shrine on Ruchika Parvata honours Maa Charchika, the eight-armed goddess of Banki. Join the Mahotsav, events, and living traditions of this sacred hill."}
          </p>
          <div className="hero-chips">
            <span>Darshan {hours}</span>
            <span>{s.address || "Banki, Cuttack, Odisha"}</span>
          </div>
          <div className="hero-ctas">
            <Link className="btn-donate" to="/events">View Events</Link>
            <Link className="btn-hero-ghost" to="/gallery">Temple Gallery</Link>
          </div>
        </div>
      </section>

      <section className="home-fests">
        <div className="wrap">
          <p className="eyebrow light">Calendar</p>
          <h2>Events</h2>
          <p className="home-fests-lead">Celebrations and gatherings throughout the year at Charchika Temple</p>
          <div className="event-grid">
            {[...site.events].filter((ev) => ev.image).sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3).map((ev) => (
              <Link className="fest-tile" key={ev.id} to={`/events/${ev.slug}`}>
                <img src={ev.image || "/festival.svg"} alt="" />
                <div className="fest-shade">
                  {ev.featured && <span className="feat-pill">Featured</span>}
                  <h3>{ev.title}</h3>
                  <p>{plainText(ev.excerpt || ev.description).slice(0, 90)}</p>
                  <small>{ev.timing || ev.startsAt}{ev.footfall ? ` · ${ev.footfall}` : ""}</small>
                </div>
              </Link>
            ))}
          </div>
          <Link className="btn-fest-all" to="/events">View all events</Link>
        </div>
      </section>

      <section className="home-news" id="books">
        <div className="wrap">
          <div className="news-head">
            <div>
              <p className="eyebrow">Publications</p>
              <h2>Books</h2>
            </div>
            <Link className="btn-outline" to="/books">View All Books</Link>
          </div>
          <div className="news-grid">
            {[...(site.books || [])].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3).map((book) => (
              <article className="news-card home-book-card" key={book.id}>
                <img src={book.image || "/book.svg"} alt="" />
                {book.featured && <span className="nb nb-featured">Featured</span>}
                {!book.featured && book.category && <span className="nb nb-latest">{book.category}</span>}
                <h3>{book.title}</h3>
                <p>{plainText(book.excerpt || book.body).slice(0, 110)}</p>
                {book.pdf ? (
                  <a className="btn-donate" href={book.pdf} download={`${book.slug || "book"}.pdf`}>Download PDF</a>
                ) : (
                  <Link className="btn-donate" to="/books">View book</Link>
                )}
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

export function About() {
  const { site } = useApp();
  const s = site?.settings || {};
  const templePhoto = s.aboutImage || s.heroImage || "/hero.jpg";
  return (
    <section className="about-band">
      <div className="wrap">
        <p className="crumb about-crumb"><Link to="/">Home</Link> · About</p>
        <div className="about-split">
          <figure className="about-photo">
            <img src={templePhoto} alt={s.aboutTitle || "Maa Charchika Temple, Banki"} />
          </figure>
          <div className="about-copy">
            <p className="eyebrow">{s.aboutEyebrow || "Adi Shakti Peetha"}</p>
            <h1>{s.aboutTitle || "Maa Charchika Temple"}</h1>
            {(s.aboutLead || !s.about) && (
              <p className="about-lead">
                {s.aboutLead || "The living shrine of Banki, Odisha — where the eight-armed goddess is worshipped on Ruchika Parvata above the Renuka river."}
              </p>
            )}
            <RichText html={s.about} />
            <dl className="about-facts">
              <div>
                <dt>Location</dt>
                <dd>{s.address || "Banki, Cuttack, Odisha"}</dd>
              </div>
              <div>
                <dt>Darshan</dt>
                <dd>{s.aboutDarshan || "6:00 AM – 9:00 PM"}</dd>
              </div>
              <div>
                <dt>Hill shrine</dt>
                <dd>{s.aboutHill || "Ruchika Parvata, Banki"}</dd>
              </div>
            </dl>
            <div className="about-actions">
              <Link className="btn-donate" to="/gallery">Temple gallery</Link>
              <Link className="btn-outline" to="/events">View events</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Events() {
  const { site } = useApp();
  const events = [...(site?.events || [])].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  return (
    <>
      <section className="page-banner">
        <div className="wrap">
          <p className="crumb"><Link to="/">Home</Link> &gt; Events</p>
          <h1>Events & Celebrations</h1>
          <p>Experience the divine celebrations throughout the year</p>
        </div>
      </section>
      <div className="fest-band">
        <div className="wrap fest-wrap">
          <h2>Major Events</h2>
          {events.map((ev) => (
            <article className="fest-card" key={ev.id}>
              <img src={ev.image || "/festival.svg"} alt={ev.title} />
              <div className="fest-body">
                {ev.featured && <span className="feat">Featured</span>}
                <h3>{ev.title}</h3>
                <p>{plainText(ev.excerpt || ev.description)}</p>
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
                <Link className="btn-donate" to={`/events/${ev.slug}`}>Learn More →</Link>
              </div>
            </article>
          ))}
          {!events.length && <p>No events yet. Add them from the admin Events page.</p>}
        </div>
      </div>
    </>
  );
}

export function EventDetail() {
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
  if (err) return <PageHero title="Event">{err}</PageHero>;
  if (!item) return <PageHero title="Event">Loading...</PageHero>;
  const overview = item.body || item.description || "";
  const rites = chips(item.rituals);
  return (
    <div className="fest-detail-page">
      <div className="wrap fest-overview">
        <div>
          <h1>Event Overview</h1>
          <RichText html={overview} />
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

export function Books() {
  const { site } = useApp();
  const books = [...(site?.books || [])].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  return (
    <>
      <section className="page-banner">
        <div className="wrap">
          <p className="crumb"><Link to="/">Home</Link> &gt; Books</p>
          <h1>Books & Publications</h1>
          <p>Literature, mahatmya, and souvenir volumes from Banki Mahotsav</p>
        </div>
      </section>
      <div className="fest-band">
        <div className="wrap fest-wrap">
          <h2>Featured Books</h2>
          {books.map((book) => (
            <article className="fest-card" key={book.id}>
              <img src={book.image || "/book.svg"} alt={book.title} />
              <div className="fest-body">
                {book.featured && <span className="feat">Featured</span>}
                <h3>{book.title}</h3>
                <p>{plainText(book.excerpt || book.body)}</p>
                <div className="fest-meta">
                  {book.author && <span>✍️ {book.author}</span>}
                  {book.language && <span>language: {book.language}</span>}
                  {book.publishedYear && <span>📅 {book.publishedYear}</span>}
                </div>
                {!!chips(book.highlights).length && (
                  <div className="hl">
                    {chips(book.highlights).map((h) => <span key={h}>{h}</span>)}
                  </div>
                )}
                {book.pdf ? (
                  <a className="btn-donate" href={book.pdf} download={`${book.slug || "book"}.pdf`}>
                    Download PDF
                  </a>
                ) : (
                  <span className="btn-donate" aria-disabled="true">PDF coming soon</span>
                )}
              </div>
            </article>
          ))}
          {!books.length && <p>No books yet. Add them from the admin Books page.</p>}
        </div>
      </div>
    </>
  );
}

export function BookDetail() {
  const { slug } = useParams();
  const { site } = useApp();
  const [item, setItem] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    const local = (site?.books || []).find((b) => b.slug === slug);
    if (local) setItem(local);
    api(`/api/books/${slug}`).then(setItem).catch((e) => {
      if (!local) setErr(e.message);
    });
  }, [slug, site]);
  if (err) return <PageHero title="Book">{err}</PageHero>;
  if (!item) return <PageHero title="Book">Loading...</PageHero>;
  const overview = item.body || item.excerpt || "";
  const themes = chips(item.highlights);
  return (
    <div className="fest-detail-page">
      <div className="wrap fest-overview">
        <div>
          <h1>Book Overview</h1>
          <RichText html={overview} />
          {item.pdf && (
            <a className="btn-donate" href={item.pdf} download={`${item.slug || "book"}.pdf`}>
              Download PDF
            </a>
          )}
        </div>
        <div>
          <img className="fest-hero-img" src={item.image || "/book.svg"} alt={item.title} />
          <div className="quick">
            <h3>Quick information</h3>
            <div className="quick-grid">
              <div><strong>Author</strong><p>{item.author || "—"}</p></div>
              <div><strong>Publisher</strong><p>{item.publisher || "—"}</p></div>
              <div><strong>Year</strong><p>{item.publishedYear || "—"}</p></div>
              <div><strong>Language</strong><p>{item.language || "—"}</p></div>
              <div><strong>Category</strong><p>{item.category || "—"}</p></div>
              <div><strong>Pages</strong><p>{item.pages || "—"}</p></div>
            </div>
          </div>
        </div>
      </div>
      {!!themes.length && (
        <section className="rituals-band">
          <div className="wrap">
            <h2>Themes & Contents</h2>
            <div className="ritual-grid">
              {themes.map((r) => (
                <article className="touch-card" key={r}>
                  <span className="touch-icon" aria-hidden="true">📖</span>
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

const CONTACT_LIMITS = { name: 80, email: 100, phone: 10, message: 1000 };

function isValidName(value) {
  const v = String(value || "").trim();
  if (v.length < 2 || v.length > CONTACT_LIMITS.name) return false;
  if (/\d/.test(v)) return false;
  return /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{0,79}$/u.test(v);
}

function isValidEmail(value) {
  const v = String(value || "").trim();
  return v.length <= CONTACT_LIMITS.email && /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v);
}

function isValidPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const ten = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  return /^[6-9]\d{9}$/.test(ten);
}

export function Contact() {
  const { site } = useApp();
  const s = site?.settings || {};
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState({});
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const address = s.address || "Charchika Temple Road, Banki, Cuttack, Odisha 754008";
  const lat = 20.377257;
  const lng = 85.527682;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  function validateForm(values = form) {
    const next = {};
    const name = values.name.trim();
    if (!name) next.name = "Please enter your full name.";
    else if (name.length < 2) next.name = "Name must be at least 2 characters.";
    else if (name.length > CONTACT_LIMITS.name) next.name = `Name cannot exceed ${CONTACT_LIMITS.name} characters.`;
    else if (!isValidName(name)) next.name = "Enter a valid name using letters only (not numbers).";
    if (!values.email.trim()) next.email = "Please enter your email address.";
    else if (values.email.trim().length > CONTACT_LIMITS.email) next.email = `Email cannot exceed ${CONTACT_LIMITS.email} characters.`;
    else if (!isValidEmail(values.email)) next.email = "Enter a valid email, for example name@gmail.com.";
    if (!values.phone.trim()) next.phone = "Please enter your mobile number.";
    else if (!isValidPhone(values.phone)) next.phone = "Enter a valid 10-digit Indian mobile number.";
    if (!values.message.trim()) next.message = "Please type your message.";
    else if (values.message.trim().length < 10) next.message = "Message must be at least 10 characters.";
    else if (values.message.length > CONTACT_LIMITS.message) next.message = `Message cannot exceed ${CONTACT_LIMITS.message} characters.`;
    return next;
  }

  function setField(key, raw) {
    let value = raw;
    if (key === "name") value = raw.replace(/[0-9]/g, "").slice(0, CONTACT_LIMITS.name);
    else if (key === "phone") value = raw.replace(/\D/g, "").slice(0, CONTACT_LIMITS.phone);
    else value = raw.slice(0, CONTACT_LIMITS[key] || raw.length);
    const nextForm = { ...form, [key]: value };
    setForm(nextForm);
    const all = validateForm(nextForm);
    if (tried) setErrors(all);
    else if (nextForm[key].trim() && all[key]) setErrors((prev) => ({ ...prev, [key]: all[key] }));
    else setErrors((prev) => ({ ...prev, [key]: "" }));
  }

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
          <div className="contact-aside">
            <h2>Get In Touch</h2>
            <p className="contact-lead">We welcome devotees, visitors, and well-wishers. Reach the committee using the details below, or send a message and we will respond.</p>
            <div className="touch-list">
              <article className="touch-row">
                <span className="touch-icon" aria-hidden="true">📍</span>
                <div>
                  <h3>Address</h3>
                  <p>{address}</p>
                </div>
              </article>
              <article className="touch-row">
                <span className="touch-icon" aria-hidden="true">📞</span>
                <div>
                  <h3>Phone</h3>
                  <p><a href={`tel:${s.phone}`}>{s.phone || "+91 9876543210"}</a></p>
                </div>
              </article>
              <article className="touch-row">
                <span className="touch-icon" aria-hidden="true">✉️</span>
                <div>
                  <h3>Email</h3>
                  <p><a href={`mailto:${s.email}`}>{s.email || "info@bankimahotsav.com"}</a></p>
                </div>
              </article>
            </div>
          </div>
          <form className={`message-card${busy ? " is-busy" : ""}`} noValidate onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (busy) return;
            setTried(true);
            const next = validateForm();
            setErrors(next);
            if (Object.keys(next).length) return;
            setBusy(true);
            try {
              await api("/api/contact", { method: "POST", body: JSON.stringify(form) });
              setForm({ name: "", email: "", phone: "", message: "" });
              setTried(false);
              setErrors({});
              await swalSuccess("Message sent", "Thank you. The temple office will get back to you.");
            } catch (e2) {
              await swalError("Could not send message", e2.message);
            } finally {
              setBusy(false);
            }
          }}>
            {busy && (
              <div className="form-loader" role="status" aria-live="polite">
                <span className="spinner" />
                <p>Sending your message…</p>
              </div>
            )}
            <h2>Send Us a Message</h2>
            <div className="form-2">
              <div className="field">
                <label htmlFor="contact-name">Full Name *</label>
                <input id="contact-name" name="name" autoComplete="name" maxLength={CONTACT_LIMITS.name} placeholder="Enter your full name" value={form.name} onChange={(e) => setField("name", e.target.value)} disabled={busy} aria-invalid={!!errors.name} />
                {errors.name && <small className="field-error">{errors.name}</small>}
              </div>
              <div className="field">
                <label htmlFor="contact-email">Email Address *</label>
                <input id="contact-email" name="email" type="text" inputMode="email" autoComplete="email" maxLength={CONTACT_LIMITS.email} placeholder="name@gmail.com" value={form.email} onChange={(e) => setField("email", e.target.value)} disabled={busy} aria-invalid={!!errors.email} />
                {errors.email && <small className="field-error">{errors.email}</small>}
              </div>
            </div>
            <div className="field">
              <label htmlFor="contact-phone">Phone Number *</label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                onInput={(e) => setField("phone", e.currentTarget.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  setField("phone", (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 10));
                }}
                disabled={busy}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <small className="field-error">{errors.phone}</small>}
            </div>
            <div className="field">
              <label htmlFor="contact-message">Message *</label>
              <textarea id="contact-message" name="message" rows={6} maxLength={CONTACT_LIMITS.message} placeholder="Type your message here..." value={form.message} onChange={(e) => setField("message", e.target.value)} disabled={busy} aria-invalid={!!errors.message} />
              <small className="field-hint">{form.message.length}/{CONTACT_LIMITS.message}</small>
              {errors.message && <small className="field-error">{errors.message}</small>}
            </div>
            <button className="btn-send" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send Message"}
            </button>
          </form>
        </div>
        <div className="wrap">
          <div className="map-card map-card-wide">
            <a className="map-open" href={mapsUrl} target="_blank" rel="noreferrer">Open in Maps ↗</a>
            <TempleMap />
          </div>
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

export function NotFound() {
  return <PageHero title="404"><p>Page not found.</p><Link className="btn-red" to="/">Go to Homepage</Link></PageHero>;
}
