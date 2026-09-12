import { NavLink, Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApp } from "./store";

function applyFavicon(href) {
  const url = href || "/favicon.svg";
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
  let apple = document.querySelector("link[rel='apple-touch-icon']");
  if (!apple) {
    apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    document.head.appendChild(apple);
  }
  apple.href = url;
}

export function Layout() {
  const { site } = useApp();
  const [open, setOpen] = useState(false);
  const s = site?.settings || {};

  useEffect(() => {
    applyFavicon(s.favicon || s.logo || "/favicon.svg");
    if (s.siteName) document.title = `${s.siteName} | Banki Mahotsav`;
  }, [s.favicon, s.logo, s.siteName]);

  return (
    <>
      <div className="util-bar">
        <div className="wrap util-inner">
          <span>Open {s.aboutDarshan || "6:00 AM – 9:00 PM"}</span>
          <span className="util-address">{s.address || "Banki, Cuttack, Odisha"}</span>
        </div>
      </div>
      <header className="main-header">
        <div className="wrap header-inner">
          <Link className="brand" to="/" onClick={() => setOpen(false)}>
            <img className="logo-img" src={s.logo || "/logo.svg"} alt="" />
            <span>
              <strong>{s.siteName || "Banki Mahotsav"}</strong>
              <small>{s.aboutEyebrow || "SHAKTI PEETHA"}</small>
            </span>
          </Link>
          <button
            className="menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? "✕" : "☰"}
          </button>
          <nav className={`nav ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/books">Books</NavLink>
            <NavLink to="/gallery">Gallery</NavLink>
            <NavLink to="/contact" className="nav-cta">Contact</NavLink>
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
        <Link to="/events">Events</Link>
        <Link to="/books">Books</Link>
        <Link to="/gallery">Gallery</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <div>
        <h4>Contact</h4>
        <a href={`tel:${s.phone}`}>{s.phone}</a>
        <a href={`mailto:${s.email}`}>{s.email}</a>
      </div>
    </div>
  );
}

export function PageHero({ title, children }) {
  return (
    <div className="page wrap">
      <h1>{title}</h1>
      {children}
    </div>
  );
}
