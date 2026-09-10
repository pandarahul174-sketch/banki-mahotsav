import { NavLink, Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { useApp } from "./store";

export function Layout() {
  const { site } = useApp();
  const [open, setOpen] = useState(false);
  const s = site?.settings || {};

  return (
    <>
      <div className="util-bar">
        <div className="wrap util-inner">
          <span>🕒 6:00 AM – 9:00 PM</span>
          <span>📍 {s.address || "Banki, Cuttack, Odisha"}</span>
        </div>
      </div>
      <header className="main-header">
        <div className="wrap header-inner">
          <Link className="brand" to="/">
            <img className="logo-img" src="/temple.svg" alt="" />
            <span>
              <strong>{s.siteName || "Banki Mahotsav"}</strong>
              <small>SHAKTI PEETHA</small>
            </span>
          </Link>
          <button className="menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu">☰</button>
          <nav className={`nav ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <div className="drop">
              <span>Temple Info ▾</span>
              <div className="drop-menu">
                {(site?.history || []).map((h) => (
                  <Link key={h.id} to={`/history/${h.slug}`}>{h.title}</Link>
                ))}
              </div>
            </div>
            <NavLink to="/pujas">Sevas & Rituals</NavLink>
            <NavLink to="/festivals">Festivals</NavLink>
            <NavLink to="/gallery">Gallery</NavLink>
            <a href="/#news">News</a>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="site-footer">
        <FooterInner s={s} />
      </footer>
    </>
  );
}

function FooterInner({ s }) {
  return (
    <div className="wrap footer-grid">
      <div>
        <h3>{s.siteName}</h3>
        <p>{s.tagline}</p>
        <p>{s.address}</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <Link to="/about">About</Link>
        <Link to="/pujas">Sevas & Rituals</Link>
        <Link to="/festivals">Festivals</Link>
        <Link to="/gallery">Gallery</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <div>
        <h4>Sevas</h4>
        <Link to="/pujas">All Sevas</Link>
        <Link to="/pujas?cat=Anjali%20Puja">Anjali Puja</Link>
        <Link to="/pujas?cat=Hawan%20Puja">Hawan Puja</Link>
        <Link to="/offerings">Offerings</Link>
      </div>
      <div>
        <h4>Contact</h4>
        <a href={`tel:${s.phone}`}>{s.phone}</a>
        <a href={`mailto:${s.email}`}>{s.email}</a>
      </div>
    </div>
  );
}

export function rupee(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

export function PageHero({ title, children }) {
  return (
    <div className="page wrap">
      <h1>{title}</h1>
      {children}
    </div>
  );
}
