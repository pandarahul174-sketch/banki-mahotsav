require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");

const config = {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "banki_mahotsav",
};

let pool;

function now() {
  return new Date();
}

function json(v, fallback) {
  if (v == null || v === "") return fallback;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function bool(v) {
  return v === true || v === 1 || v === "1" || v === "true";
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY,
  site_name VARCHAR(255),
  tagline VARCHAR(255),
  priest_name VARCHAR(255),
  priest_father VARCHAR(255),
  phone VARCHAR(64),
  email VARCHAR(255),
  whatsapp VARCHAR(64),
  address VARCHAR(500),
  welcome_title VARCHAR(255),
  welcome_subtitle VARCHAR(255),
  hero_image VARCHAR(500),
  about TEXT,
  disclaimer JSON
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(191) UNIQUE,
  title VARCHAR(255),
  starts_at DATE NULL,
  ends_at DATE NULL,
  description TEXT,
  excerpt TEXT,
  body TEXT,
  image VARCHAR(500),
  timing VARCHAR(255),
  duration VARCHAR(128),
  footfall VARCHAR(128),
  location VARCHAR(255),
  highlights TEXT,
  rituals TEXT,
  cta VARCHAR(128),
  featured TINYINT(1) DEFAULT 0,
  active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS books (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(191) UNIQUE,
  title VARCHAR(255),
  author VARCHAR(255),
  publisher VARCHAR(255),
  published_year VARCHAR(32),
  language VARCHAR(64),
  category VARCHAR(128),
  pages VARCHAR(32),
  excerpt TEXT,
  body TEXT,
  image VARCHAR(500),
  pdf VARCHAR(500),
  highlights TEXT,
  featured TINYINT(1) DEFAULT 0,
  active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS gallery (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255),
  category VARCHAR(64),
  image VARCHAR(500),
  sort_order INT DEFAULT 0,
  active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(64),
  message TEXT,
  \`read\` TINYINT(1) DEFAULT 0,
  created_at DATETIME NOT NULL
);
`;

function mapSettings(row) {
  if (!row) return null;
  return {
    siteName: row.site_name,
    tagline: row.tagline,
    priestName: row.priest_name,
    priestFather: row.priest_father,
    phone: row.phone,
    email: row.email,
    contactEmail: row.contact_email || "",
    whatsapp: row.whatsapp,
    address: row.address,
    welcomeTitle: row.welcome_title,
    welcomeSubtitle: row.welcome_subtitle,
    heroImage: row.hero_image,
    about: row.about,
    aboutEyebrow: row.about_eyebrow || "",
    aboutTitle: row.about_title || "",
    aboutLead: row.about_lead || "",
    aboutImage: row.about_image || "",
    aboutDarshan: row.about_darshan || "",
    aboutHill: row.about_hill || "",
    logo: row.logo || "",
    favicon: row.favicon || "",
    footerAbout: row.footer_about || "",
    footerTitle: row.footer_title || "",
    footerAddress: row.footer_address || "",
    footerPhone: row.footer_phone || "",
    footerEmail: row.footer_email || "",
    footerLinksTitle: row.footer_links_title || "",
    footerContactTitle: row.footer_contact_title || "",
    footerLinks: json(row.footer_links, []),
    copyright: row.copyright || "",
    disclaimer: json(row.disclaimer, []),
  };
}

function settingsToRow(s) {
  return {
    id: 1,
    site_name: s.siteName,
    tagline: s.tagline,
    priest_name: s.priestName,
    priest_father: s.priestFather,
    phone: s.phone,
    email: s.email,
    contact_email: s.contactEmail || "",
    whatsapp: s.whatsapp,
    address: s.address,
    welcome_title: s.welcomeTitle,
    welcome_subtitle: s.welcomeSubtitle,
    hero_image: s.heroImage,
    about: s.about,
    about_eyebrow: s.aboutEyebrow || "",
    about_title: s.aboutTitle || "",
    about_lead: s.aboutLead || "",
    about_image: s.aboutImage || "",
    about_darshan: s.aboutDarshan || "",
    about_hill: s.aboutHill || "",
    logo: s.logo || "",
    favicon: s.favicon || "",
    footer_about: s.footerAbout || "",
    footer_title: s.footerTitle || "",
    footer_address: s.footerAddress || "",
    footer_phone: s.footerPhone || "",
    footer_email: s.footerEmail || "",
    footer_links_title: s.footerLinksTitle || "",
    footer_contact_title: s.footerContactTitle || "",
    footer_links: JSON.stringify(s.footerLinks || []),
    copyright: s.copyright || "",
    disclaimer: JSON.stringify(s.disclaimer || []),
  };
}

const MAPS = {
  books: (r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    author: r.author || "",
    publisher: r.publisher || "",
    publishedYear: r.published_year || "",
    language: r.language || "",
    category: r.category || "",
    pages: r.pages || "",
    excerpt: r.excerpt || "",
    body: r.body || "",
    image: r.image,
    pdf: r.pdf || "",
    highlights: r.highlights || "",
    featured: bool(r.featured),
    active: r.active == null ? true : bool(r.active),
  }),
  events: (r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    startsAt: r.starts_at ? String(r.starts_at).slice(0, 10) : "",
    endsAt: r.ends_at ? String(r.ends_at).slice(0, 10) : "",
    description: r.description,
    excerpt: r.excerpt || r.description,
    body: r.body || r.description,
    image: r.image,
    timing: r.timing || "",
    duration: r.duration || "",
    footfall: r.footfall || "",
    location: r.location || "",
    highlights: r.highlights || "",
    rituals: r.rituals || "",
    cta: r.cta,
    featured: bool(r.featured),
    active: r.active == null ? true : bool(r.active),
  }),
  gallery: (r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    image: r.image,
    order: r.sort_order,
    active: r.active == null ? true : bool(r.active),
  }),
  messages: (r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    read: bool(r.read),
    createdAt: r.created_at,
  }),
  users: (r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    password: r.password,
    role: r.role,
    createdAt: r.created_at,
  }),
};

function toCols(obj) {
  const out = {};
  const map = {
    siteName: "site_name",
    tagline: "tagline",
    priestName: "priest_name",
    priestFather: "priest_father",
    phone: "phone",
    email: "email",
    whatsapp: "whatsapp",
    address: "address",
    welcomeTitle: "welcome_title",
    welcomeSubtitle: "welcome_subtitle",
    heroImage: "hero_image",
    about: "about",
    aboutEyebrow: "about_eyebrow",
    aboutTitle: "about_title",
    aboutLead: "about_lead",
    aboutImage: "about_image",
    aboutDarshan: "about_darshan",
    aboutHill: "about_hill",
    logo: "logo",
    favicon: "favicon",
    disclaimer: "disclaimer",
    slug: "slug",
    title: "title",
    excerpt: "excerpt",
    body: "body",
    image: "image",
    order: "sort_order",
    category: "category",
    duration: "duration",
    featured: "featured",
    active: "active",
    description: "description",
    startsAt: "starts_at",
    endsAt: "ends_at",
    cta: "cta",
    timing: "timing",
    footfall: "footfall",
    location: "location",
    highlights: "highlights",
    rituals: "rituals",
    author: "author",
    publisher: "publisher",
    publishedYear: "published_year",
    language: "language",
    pages: "pages",
    pdf: "pdf",
    name: "name",
    createdAt: "created_at",
    message: "message",
    read: "read",
    password: "password",
    role: "role",
  };
  for (const [k, v] of Object.entries(obj)) {
    if (k === "id") continue;
    const col = map[k] || k;
    if (k === "disclaimer") {
      out[col] = JSON.stringify(v ?? []);
    } else if (k === "featured" || k === "read" || k === "active") {
      out[col] = bool(v) ? 1 : 0;
    } else if ((k === "startsAt" || k === "endsAt") && (v === "" || v == null)) {
      out[col] = null;
    } else {
      out[col] = v;
    }
  }
  return out;
}

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function init() {
  const { database, ...rest } = config;
  const boot = await mysql.createConnection(rest);
  await boot.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await boot.end();
  pool = mysql.createPool({ ...config, waitForConnections: true, connectionLimit: 10 });
  for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
    await pool.query(stmt);
  }
  for (const t of ["history", "pujas", "offerings", "products", "news", "reviews", "bookings", "orders"]) {
    await query(`DROP TABLE IF EXISTS \`${t}\``);
  }
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM users");
  if (Number(n) === 0) await seed();
  await ensureEventColumns();
  await ensureBookColumns();
  await ensureActiveColumns();
  await ensureAboutSettingsColumns();
  await seedFestivalsIfNeeded();
  await seedBooksIfNeeded();
}

async function ensureEventColumns() {
  const needed = {
    excerpt: "TEXT",
    body: "TEXT",
    image: "VARCHAR(500)",
    timing: "VARCHAR(255)",
    duration: "VARCHAR(128)",
    footfall: "VARCHAR(128)",
    location: "VARCHAR(255)",
    highlights: "TEXT",
    rituals: "TEXT",
  };
  const cols = await query("SHOW COLUMNS FROM events");
  const have = new Set(cols.map((c) => c.Field));
  for (const [name, def] of Object.entries(needed)) {
    if (!have.has(name)) await query(`ALTER TABLE events ADD COLUMN \`${name}\` ${def}`);
  }
}

async function ensureBookColumns() {
  const cols = await query("SHOW COLUMNS FROM books");
  const have = new Set(cols.map((c) => c.Field));
  if (!have.has("pdf")) await query("ALTER TABLE books ADD COLUMN `pdf` VARCHAR(500)");
}

async function ensureActiveColumns() {
  for (const table of ["events", "books", "gallery"]) {
    const cols = await query(`SHOW COLUMNS FROM \`${table}\``);
    const have = new Set(cols.map((c) => c.Field));
    if (!have.has("active")) {
      await query(`ALTER TABLE \`${table}\` ADD COLUMN \`active\` TINYINT(1) DEFAULT 1`);
      await query(`UPDATE \`${table}\` SET active = 1 WHERE active IS NULL`);
    }
  }
}

async function ensureAboutSettingsColumns() {
  const needed = {
    about_eyebrow: "VARCHAR(255)",
    about_title: "VARCHAR(255)",
    about_lead: "TEXT",
    about_image: "VARCHAR(500)",
    about_darshan: "VARCHAR(255)",
    about_hill: "VARCHAR(255)",
    logo: "VARCHAR(500)",
    favicon: "VARCHAR(500)",
    contact_email: "VARCHAR(255)",
    footer_about: "TEXT",
    footer_title: "VARCHAR(255)",
    footer_address: "VARCHAR(500)",
    footer_phone: "VARCHAR(64)",
    footer_email: "VARCHAR(255)",
    footer_links_title: "VARCHAR(128)",
    footer_contact_title: "VARCHAR(128)",
    footer_links: "JSON",
    copyright: "VARCHAR(255)",
  };
  const cols = await query("SHOW COLUMNS FROM settings");
  const have = new Set(cols.map((c) => c.Field));
  for (const [name, def] of Object.entries(needed)) {
    if (!have.has(name)) await query(`ALTER TABLE settings ADD COLUMN \`${name}\` ${def}`);
  }
  await query("UPDATE settings SET logo = COALESCE(NULLIF(logo,''), '/logo.svg'), favicon = COALESCE(NULLIF(favicon,''), '/favicon.svg') WHERE id = 1");
  await query("UPDATE settings SET contact_email = COALESCE(NULLIF(contact_email,''), email) WHERE id = 1");
  await query("UPDATE settings SET copyright = COALESCE(NULLIF(copyright,''), '© 2026 Banki Mahotsav. All rights reserved.') WHERE id = 1");
  await query(`UPDATE settings SET
    footer_title = COALESCE(NULLIF(footer_title,''), site_name),
    footer_about = COALESCE(NULLIF(footer_about,''), tagline),
    footer_address = COALESCE(NULLIF(footer_address,''), address),
    footer_phone = COALESCE(NULLIF(footer_phone,''), phone),
    footer_email = COALESCE(NULLIF(footer_email,''), email),
    footer_links_title = COALESCE(NULLIF(footer_links_title,''), 'Quick Links'),
    footer_contact_title = COALESCE(NULLIF(footer_contact_title,''), 'Contact')
    WHERE id = 1`);
  await query(`UPDATE settings SET footer_links = ? WHERE id = 1 AND (footer_links IS NULL OR CAST(footer_links AS CHAR) IN ('', 'null', '[]'))`, [
    JSON.stringify([
      { label: "About", path: "/about" },
      { label: "Events", path: "/events" },
      { label: "Books", path: "/books" },
      { label: "Gallery", path: "/gallery" },
      { label: "Contact", path: "/contact" },
    ]),
  ]);
}

function festivalSeed() {
  return [
    {
      id: uuid(),
      slug: "banki-mahotsav",
      title: "Banki Mahotsav",
      startsAt: "2026-01-10",
      endsAt: "2026-01-14",
      description: "The cultural and spiritual gathering of Banki, with Charchika puja, folk arts, literature, and community seva.",
      excerpt: "Banki Mahotsav brings artistes, writers, and devotees together around Maa Charchika — cultural nights, crafts, and festival puja at Ruchika Parvata.",
      body: "Banki Mahotsav is the living festival of Banki, Odisha. Stages host Odissi, pala, sankirtan, and local crafts while the Charchika shrine remains the spiritual heart of the town.\n\nFamilies travel from across Cuttack district for darshan, prasad, and night-long kirtan. The Mahotsav also honours Odia literature and social harmony through Charchika Samman and community programmes.\n\nIf you cannot attend in person, you may still book puja and offerings through this portal.",
      image: "https://images.pexels.com/photos/10931719/pexels-photo-10931719.jpeg?auto=compress&cs=tinysrgb&w=1200",
      timing: "January (Magha)",
      duration: "4–5 days",
      footfall: "Thousands daily",
      location: "Banki, Cuttack, Odisha",
      highlights: "Charchika puja, Cultural nights, Folk arts, Community seva",
      rituals: "Charchika special puja\nEvening deepa seva\nSankirtan and pala\nPrasad distribution",
      cta: "Send Puja",
      featured: true,
    },
    {
      id: uuid(),
      slug: "chaitra-jatra",
      title: "Chaitra Jatra",
      startsAt: "2026-03-20",
      endsAt: "2026-04-10",
      description: "Chaitra month celebration at Charchika Temple with special pujas, cultural programmes, and large gatherings of devotees.",
      excerpt: "The most important seasonal festival at Charchika Temple, held in Chaitra (March–April), with special pujas, cultural programmes, and grand meals.",
      body: "Chaitra Jatra is among the most significant annual observances at Maa Charchika Temple. During the Odia month of Chaitra, devotees gather on Ruchika Parvata for special anjali, cultural programmes, and community bhog.\n\nThe temple extends its hours on peak days to welcome pilgrims. Families offer flowers, sindoor, and vows, believing the goddess grants protection and fulfilment of sincere wishes.\n\nBanki Mahotsav committee and local seva groups support crowd arrangements, prasad, and night-long kirtan through the fortnight.",
      image: "https://images.pexels.com/photos/37862812/pexels-photo-37862812.jpeg?auto=compress&cs=tinysrgb&w=1200",
      timing: "March–April (Chaitra month)",
      duration: "15–21 days",
      footfall: "80,000+ daily",
      location: "Charchika Temple, Banki",
      highlights: "Mass tonsure ceremony, Special pujas and rituals, Cultural programmes, Grand feast (maha)",
      rituals: "Chaitra special puja\nMundan / tonsure seva\nPushpanjali and deepa\nCommunity maha prasad",
      cta: "Learn More",
      featured: true,
    },
    {
      id: uuid(),
      slug: "durga-puja",
      title: "Durga Puja at Charchika",
      startsAt: "2026-09-27",
      endsAt: "2026-10-06",
      description: "Sharadiya Durga Puja at the Charchika shrine with navratri rituals, sandhya aarti, and festive gatherings.",
      excerpt: "Sharadiya Navratri at Charchika Temple — nine nights of aarti, cultural programmes, and Ashtami-Navami special puja.",
      body: "During Sharadiya Durga Puja, Charchika Temple becomes the centre of Navratri worship in Banki. The eight-armed goddess is honoured with daily sandhya aarti, special Ashtami and Navami pujas, and cultural evenings.\n\nDevotees offer sarees, bhog, and anjali. The hill shrine and the town below fill with lamps, pala, and family gatherings.\n\nBook a puja in advance if you wish the sankalp to be performed in your name during the festival days.",
      image: "https://images.pexels.com/photos/5458388/pexels-photo-5458388.jpeg?auto=compress&cs=tinysrgb&w=1200",
      timing: "September–October (Ashwina)",
      duration: "9–10 days",
      footfall: "Large festive crowds",
      location: "Charchika Temple, Banki",
      highlights: "Navratri aarti, Ashtami-Navami puja, Cultural evenings, Saree offering",
      rituals: "Daily sandhya aarti\nAshtami special puja\nNavami hawan\nVijaya dashami visarjan prayers",
      cta: "Book Puja",
      featured: false,
    },
  ];
}

async function seedFestivalsIfNeeded() {
  const rows = await query("SELECT slug, image FROM events");
  const have = new Set(rows.map((r) => r.slug));
  for (const item of festivalSeed()) {
    if (!have.has(item.slug)) await insertRow("events", item);
  }
  for (const item of festivalSeed()) {
    await query(
      "UPDATE events SET excerpt = COALESCE(NULLIF(excerpt,''), ?), body = COALESCE(NULLIF(body,''), ?), image = COALESCE(NULLIF(image,''), ?), timing = COALESCE(NULLIF(timing,''), ?), duration = COALESCE(NULLIF(duration,''), ?), footfall = COALESCE(NULLIF(footfall,''), ?), location = COALESCE(NULLIF(location,''), ?), highlights = COALESCE(NULLIF(highlights,''), ?), rituals = COALESCE(NULLIF(rituals,''), ?) WHERE slug = ?",
      [item.excerpt, item.body, item.image, item.timing, item.duration, item.footfall, item.location, item.highlights, item.rituals, item.slug]
    );
  }
}

function bookSeed() {
  return [
    {
      id: uuid(),
      slug: "charchika-mahatmya",
      title: "Charchika Mahatmya",
      author: "Temple literary committee",
      publisher: "Banki Mahotsav",
      publishedYear: "2018",
      language: "Odia",
      category: "Devotional",
      pages: "96",
      excerpt: "A short mahatmya of Maa Charchika — the eight-armed goddess of Ruchika Parvata, her legends, daily seva, and the faith of Banki.",
      body: "Charchika Mahatmya gathers the living stories of Maa Charchika, the Ashta-bhuja Chamunda of Banki. It retells how the shrine on Ruchika Parvata became a Shakti peetha for Cuttack district, and how families still climb the hill for darshan, anjali, and vows.\n\nThe booklet also describes daily puja, special Ashtami rites, and the way Banki Mahotsav keeps the goddess at the centre of public life.\n\nReaders will find simple Odia verse, local memory, and a short guide for pilgrims who wish to understand the shrine before they visit.",
      image: "https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=1200",
      pdf: "/books/sample.pdf",
      highlights: "Temple legend, Daily seva, Pilgrim notes, Odia verse",
      featured: true,
    },
    {
      id: uuid(),
      slug: "banki-mahotsav-smriti-grantha",
      title: "Banki Mahotsav Smriti Grantha",
      author: "Banki Mahotsav Committee",
      publisher: "Banki Mahotsav",
      publishedYear: "2024",
      language: "Odia & English",
      category: "Literature",
      pages: "180",
      excerpt: "The souvenir volume of Banki Mahotsav — essays, poems, photographs, and Charchika Samman notes from writers and artistes of the region.",
      body: "Each edition of Banki Mahotsav publishes a smriti grantha that records the year's literature, folk arts, and community programmes. This volume brings together Odia poems, essays on Banki's cultural memory, and photographs from the stage and the shrine.\n\nIt also documents Charchika Samman and the social harmony that the Mahotsav tries to keep alive.\n\nKeep this book as a companion to the festival: it is meant for readers at home as much as for visitors in Banki.",
      image: "https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg?auto=compress&cs=tinysrgb&w=1200",
      pdf: "/books/sample.pdf",
      highlights: "Poems and essays, Festival photographs, Charchika Samman, Bilingual notes",
      featured: true,
    },
    {
      id: uuid(),
      slug: "shakti-peethas-of-coastal-odisha",
      title: "Shakti Peethas of Coastal Odisha",
      author: "Regional research notes",
      publisher: "Heritage series",
      publishedYear: "2021",
      language: "English",
      category: "History",
      pages: "128",
      excerpt: "A readable introduction to coastal Odisha's Shakti shrines, with a chapter on Charchika Temple, Ruchika Parvata, and the Renuka river.",
      body: "This book places Charchika Temple among the Shakti peethas of coastal Odisha. It describes the hill shrine, the river below, and how local worship sits beside wider Chamunda and Durga traditions.\n\nA dedicated chapter follows the pilgrim path at Banki and the seasonal gatherings of Chaitra and Sharadiya.\n\nMaps, short notes, and a glossary help first-time visitors and students of Odisha's sacred geography.",
      image: "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=1200",
      pdf: "/books/sample.pdf",
      highlights: "Temple geography, Chamunda tradition, Pilgrim path, Glossary",
      featured: false,
    },
    {
      id: uuid(),
      slug: "pala-and-sankirtan-of-banki",
      title: "Pala and Sankirtan of Banki",
      author: "Folk arts archive",
      publisher: "Mahotsav cultural cell",
      publishedYear: "2019",
      language: "Odia",
      category: "Folk arts",
      pages: "112",
      excerpt: "Notes on pala, sankirtan, and night-long kirtan that fill Banki during Mahotsav and temple festivals.",
      body: "Banki's festivals are not only puja. Stages and courtyards fill with pala, sankirtan, and folk song. This book records performers, typical sequences, and the way these arts sit beside Charchika worship.\n\nIt is written for students, artistes, and families who want to follow the cultural nights of the Mahotsav with more understanding.\n\nPhotographs and programme notes from past editions are included as a small archive.",
      image: "https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg?auto=compress&cs=tinysrgb&w=1200",
      pdf: "/books/sample.pdf",
      highlights: "Pala, Sankirtan, Cultural nights, Performer notes",
      featured: false,
    },
  ];
}

async function seedBooksIfNeeded() {
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM books");
  if (Number(n) === 0) {
    for (const item of bookSeed()) await insertRow("books", item);
  }
  for (const item of bookSeed()) {
    await query("UPDATE books SET pdf = COALESCE(NULLIF(pdf,''), ?) WHERE slug = ?", [item.pdf, item.slug]);
  }
}

function seedPayload() {
  const adminHash = bcrypt.hashSync("admin123", 10);
  return {
    settings: {
      siteName: "Banki Mahotsav",
      tagline: "Maa Charchika · Banki, Odisha",
      priestName: "Banki Mahotsav Committee",
      priestFather: "Charchika Temple Seva",
      phone: "+91 9876543210",
      email: "info@bankimahotsav.com",
      contactEmail: "info@bankimahotsav.com",
      whatsapp: "+91 9876543210",
      address: "Charchika Temple Road, Banki, Cuttack, Odisha 754008",
      copyright: "© 2026 Banki Mahotsav. All rights reserved.",
      footerTitle: "Banki Mahotsav",
      footerAbout: "Maa Charchika · Banki, Odisha",
      footerAddress: "Charchika Temple Road, Banki, Cuttack, Odisha 754008",
      footerPhone: "+91 9876543210",
      footerEmail: "info@bankimahotsav.com",
      footerLinksTitle: "Quick Links",
      footerContactTitle: "Contact",
      footerLinks: [
        { label: "About", path: "/about" },
        { label: "Events", path: "/events" },
        { label: "Books", path: "/books" },
        { label: "Gallery", path: "/gallery" },
        { label: "Contact", path: "/contact" },
      ],
      welcomeTitle: "Welcome to Banki Mahotsav",
      welcomeSubtitle: "Jai Maa Charchika",
      heroImage: "/hero.jpg",
      about:
        "Banki Mahotsav is the cultural and spiritual gathering of Banki, Odisha — celebrating Maa Charchika, Odia folk arts, literature, and community seva.",
      disclaimer: [
        "This portal is managed by the Banki Mahotsav organizing committee for devotees and visitors.",
        "Festival dates, cultural programmes, and darshan timings may change — check Events before you travel.",
      ],
    },
    users: [
      { id: "admin-1", name: "Administrator", email: "admin@bankimahotsav.com", password: adminHash, role: "admin", createdAt: now() },
    ],
    events: [festivalSeed()[0]],
  };
}

async function insertRow(table, obj) {
  const cols = toCols(obj);
  if (obj.id) cols.id = obj.id;
  const keys = Object.keys(cols);
  const sql = `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(",")}) VALUES (${keys.map(() => "?").join(",")})`;
  await query(sql, keys.map((k) => cols[k]));
}

async function seed() {
  const data = seedPayload();
  const s = settingsToRow(data.settings);
  const keys = Object.keys(s);
  await query(
    `INSERT INTO settings (${keys.map((k) => `\`${k}\``).join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
    keys.map((k) => s[k])
  );
  for (const u of data.users) await insertRow("users", u);
  for (const e of data.events) await insertRow("events", e);
}

async function list(table, extra = "") {
  const rows = await query(`SELECT * FROM \`${table}\` ${extra}`);
  return rows.map(MAPS[table]);
}

async function findBy(table, col, value) {
  const rows = await query(`SELECT * FROM \`${table}\` WHERE \`${col}\` = ? LIMIT 1`, [value]);
  return rows[0] ? MAPS[table](rows[0]) : null;
}

async function updateRow(table, id, obj) {
  const cols = toCols(obj);
  const keys = Object.keys(cols);
  if (!keys.length) return findBy(table, "id", id);
  await query(
    `UPDATE \`${table}\` SET ${keys.map((k) => `\`${k}\` = ?`).join(", ")} WHERE id = ?`,
    [...keys.map((k) => cols[k]), id]
  );
  return findBy(table, "id", id);
}

async function remove(table, id) {
  await query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
}

async function getSettings() {
  const rows = await query("SELECT * FROM settings WHERE id = 1");
  return mapSettings(rows[0]);
}

async function saveSettings(s) {
  const current = await getSettings();
  const merged = { ...current, ...s };
  const row = settingsToRow(merged);
  const keys = Object.keys(row).filter((k) => k !== "id");
  await query(`UPDATE settings SET ${keys.map((k) => `\`${k}\` = ?`).join(", ")} WHERE id = 1`, keys.map((k) => row[k]));
  return getSettings();
}

module.exports = {
  init,
  query,
  list,
  findBy,
  insertRow,
  updateRow,
  remove,
  getSettings,
  saveSettings,
  uuid,
  now,
};
