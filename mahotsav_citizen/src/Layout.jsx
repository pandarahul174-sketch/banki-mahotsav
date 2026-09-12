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
        <div className="header-inner">
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
  const copy = s.copyright || `© 2026 ${s.footerTitle || s.siteName || "Banki Mahotsav"}. All rights reserved.`;
  const title = s.footerTitle || s.siteName || "Banki Mahotsav";
  const about = s.footerAbout || s.tagline;
  const address = s.footerAddress || s.address;
  const phone = s.footerPhone || s.phone;
  const email = s.footerEmail || s.email;
  const links = Array.isArray(s.footerLinks) && s.footerLinks.length
    ? s.footerLinks.filter((l) => l.label && l.path)
    : [
      { label: "About", path: "/about" },
      { label: "Events", path: "/events" },
      { label: "Books", path: "/books" },
      { label: "Gallery", path: "/gallery" },
      { label: "Contact", path: "/contact" },
    ];
  return (
    <>
      <div className="footer-inner">
        <div className="footer-brand">
          <h3>{title}</h3>
          {about && <p>{about}</p>}
          {address && <p>{address}</p>}
        </div>
        <div className="footer-cols">
          <div className="footer-nav">
            <h4>{s.footerLinksTitle || "Quick Links"}</h4>
            <div className="footer-nav-links">
              {links.map((l) => (
                String(l.path).startsWith("http")
                  ? <a key={`${l.path}-${l.label}`} href={l.path} target="_blank" rel="noreferrer">{l.label}</a>
                  : <Link key={`${l.path}-${l.label}`} to={l.path}>{l.label}</Link>
              ))}
            </div>
          </div>
          <div className="footer-contact">
            <h4>{s.footerContactTitle || "Contact"}</h4>
            {phone && <a href={`tel:${phone}`}>{phone}</a>}
            {email && <a href={`mailto:${email}`}>{email}</a>}
          </div>
        </div>
      </div>
      <div className="footer-copy">
        <p>{copy}</p>
      </div>
    </>
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
