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

CREATE TABLE IF NOT EXISTS history (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(191) UNIQUE,
  title VARCHAR(255),
  subtitle VARCHAR(255),
  excerpt TEXT,
  body TEXT,
  image VARCHAR(500),
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pujas (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(191) UNIQUE,
  title VARCHAR(255),
  category VARCHAR(128),
  price DECIMAL(10,2) DEFAULT 0,
  duration VARCHAR(64),
  featured TINYINT(1) DEFAULT 0,
  description TEXT,
  image VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS offerings (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(191) UNIQUE,
  title VARCHAR(255),
  price DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  image VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(191) UNIQUE,
  title VARCHAR(255),
  price DECIMAL(10,2) DEFAULT 0,
  category VARCHAR(128),
  consecrated TINYINT(1) DEFAULT 0,
  stock INT DEFAULT 0,
  description TEXT,
  image VARCHAR(500)
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
  featured TINYINT(1) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS news (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255),
  excerpt TEXT,
  badge VARCHAR(32),
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  rating INT DEFAULT 5,
  text TEXT,
  approved TINYINT(1) DEFAULT 0,
  reactions JSON,
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(64),
  puja_id VARCHAR(64),
  puja_title VARCHAR(255),
  amount DECIMAL(10,2) DEFAULT 0,
  date VARCHAR(64),
  gotra VARCHAR(128),
  notes TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(64),
  address TEXT,
  items JSON,
  total DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(32) DEFAULT 'pending',
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS gallery (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255),
  category VARCHAR(64),
  image VARCHAR(500),
  sort_order INT DEFAULT 0
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
    whatsapp: row.whatsapp,
    address: row.address,
    welcomeTitle: row.welcome_title,
    welcomeSubtitle: row.welcome_subtitle,
    heroImage: row.hero_image,
    about: row.about,
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
    whatsapp: s.whatsapp,
    address: s.address,
    welcome_title: s.welcomeTitle,
    welcome_subtitle: s.welcomeSubtitle,
    hero_image: s.heroImage,
    about: s.about,
    disclaimer: JSON.stringify(s.disclaimer || []),
  };
}

const MAPS = {
  history: (r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    excerpt: r.excerpt,
    body: r.body,
    image: r.image,
    order: r.sort_order,
  }),
  pujas: (r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    price: Number(r.price),
    duration: r.duration,
    featured: bool(r.featured),
    description: r.description,
    image: r.image,
  }),
  offerings: (r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    price: Number(r.price),
    description: r.description,
    image: r.image,
  }),
  products: (r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    price: Number(r.price),
    category: r.category,
    consecrated: bool(r.consecrated),
    stock: Number(r.stock),
    description: r.description,
    image: r.image,
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
  }),
  news: (r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    badge: r.badge || "Latest",
    createdAt: r.created_at,
  }),
  gallery: (r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    image: r.image,
    order: r.sort_order,
  }),
  reviews: (r) => ({
    id: r.id,
    name: r.name,
    rating: Number(r.rating),
    text: r.text,
    approved: bool(r.approved),
    reactions: json(r.reactions, { like: 0, love: 0, clap: 0 }),
    createdAt: r.created_at,
  }),
  bookings: (r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    pujaId: r.puja_id,
    pujaTitle: r.puja_title,
    amount: Number(r.amount),
    date: r.date,
    gotra: r.gotra,
    notes: r.notes,
    status: r.status,
    createdAt: r.created_at,
  }),
  orders: (r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    address: r.address,
    items: json(r.items, []),
    total: Number(r.total),
    status: r.status,
    createdAt: r.created_at,
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
    disclaimer: "disclaimer",
    slug: "slug",
    title: "title",
    subtitle: "subtitle",
    excerpt: "excerpt",
    body: "body",
    image: "image",
    order: "sort_order",
    category: "category",
    price: "price",
    duration: "duration",
    featured: "featured",
    description: "description",
    consecrated: "consecrated",
    stock: "stock",
    startsAt: "starts_at",
    endsAt: "ends_at",
    cta: "cta",
    excerpt: "excerpt",
    body: "body",
    timing: "timing",
    footfall: "footfall",
    location: "location",
    highlights: "highlights",
    rituals: "rituals",
    badge: "badge",
    name: "name",
    rating: "rating",
    text: "text",
    approved: "approved",
    reactions: "reactions",
    createdAt: "created_at",
    pujaId: "puja_id",
    pujaTitle: "puja_title",
    amount: "amount",
    date: "date",
    gotra: "gotra",
    notes: "notes",
    status: "status",
    items: "items",
    total: "total",
    message: "message",
    read: "read",
    password: "password",
    role: "role",
  };
  for (const [k, v] of Object.entries(obj)) {
    if (k === "id") continue;
    const col = map[k] || k;
    if (k === "disclaimer" || k === "reactions" || k === "items") {
      out[col] = JSON.stringify(v ?? (k === "items" ? [] : k === "disclaimer" ? [] : { like: 0, love: 0, clap: 0 }));
    } else if (k === "featured" || k === "consecrated" || k === "approved" || k === "read") {
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
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM users");
  if (Number(n) === 0) await seed();
  await ensureEventColumns();
  await seedFestivalsIfNeeded();
  await seedNewsIfNeeded();
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

function newsSeed() {
  return [
    {
      id: uuid(),
      title: "Special Darshan Timings for Charchika Jatra",
      excerpt: "Temple hours are extended during peak festival days. Evening aarti and special anjali will continue later than usual.",
      badge: "Featured",
      createdAt: now(),
    },
    {
      id: uuid(),
      title: "Online Donation Portal Now Available",
      excerpt: "Devotees can now send offerings and puja bookings from home. Confirmations are shared by the festival office.",
      badge: "Latest",
      createdAt: now(),
    },
    {
      id: uuid(),
      title: "Parking Arrangements for Festival Season",
      excerpt: "Additional parking is arranged near Ruchika Parvata during festival crowds. Follow volunteer guidance at the base of the hill.",
      badge: "Urgent",
      createdAt: now(),
    },
  ];
}

async function seedNewsIfNeeded() {
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM news");
  if (Number(n) === 0) {
    for (const item of newsSeed()) await insertRow("news", item);
  }
}

function seedPayload() {
  const adminHash = bcrypt.hashSync("admin123", 10);
  const devoteeHash = bcrypt.hashSync("devotee123", 10);
  return {
    settings: {
      siteName: "Banki Mahotsav",
      tagline: "Maa Charchika · Banki, Odisha",
      priestName: "Banki Mahotsav Committee",
      priestFather: "Charchika Temple Seva",
      phone: "+91 9876543210",
      email: "info@bankimahotsav.com",
      whatsapp: "+91 9876543210",
      address: "Charchika Temple Road, Banki, Cuttack, Odisha 754008",
      welcomeTitle: "Welcome to Banki Mahotsav",
      welcomeSubtitle: "Jai Maa Charchika",
      heroImage: "/hero.svg",
      about:
        "Banki Mahotsav is the cultural and spiritual gathering of Banki, Odisha — celebrating Maa Charchika, Odia folk arts, literature, and community seva. Book pujas, send offerings, and support the festival from anywhere.",
      disclaimer: [
        "This portal is managed by the Banki Mahotsav organizing committee for devotees and visitors.",
        "Puja bookings are performed by designated priests associated with the festival seva, not as an official temple-committee ticket counter.",
        "Please mention any known priest or special sankalp while booking.",
        "Festival dates, cultural programmes, and darshan timings may change — check Events before you travel.",
      ],
    },
    users: [
      { id: "admin-1", name: "Administrator", email: "admin@bankimahotsav.com", password: adminHash, role: "admin", createdAt: now() },
      { id: "user-1", name: "Demo Devotee", email: "devotee@bankimahotsav.com", password: devoteeHash, role: "devotee", createdAt: now() },
    ],
    history: [
      { id: uuid(), slug: "maa-charchika", title: "Maa Charchika", subtitle: "Ashta-bhuja Chamunda of Banki", excerpt: "Maa Charchika, an eight-armed form of Chamunda, is the presiding goddess of Banki. She is seated upon Ruchika Parvata on the banks of the Renuka river.", body: "Maa Charchika is among the oldest Shakti peethas of Odisha. The goddess is depicted with eight arms, a garland of skulls, and fierce protective grace. Devotees believe she grants courage, protection, and fulfilment of sincere wishes. Daily puja, special Ashtami rituals, and festival anjali are offered throughout the year, with Banki Mahotsav bringing the whole region together in her honour.", image: "/temple.svg", order: 1 },
      { id: uuid(), slug: "charchika-temple", title: "Charchika Temple", subtitle: "Ruchika Parvata · Renuka river", excerpt: "The temple stands on a small hillock above the Renuka river. Its shrine, steps, and surrounding fairs have shaped Banki's identity for generations.", body: "Charchika Temple sits on Ruchika Parvata in Banki, Cuttack district. Pilgrims climb to the sanctum for darshan of the eight-armed goddess. The temple complex becomes the spiritual heart of Banki Mahotsav, when cultural programmes, prasad distribution, and night-long kirtan fill the town. Architecture, folk memory, and living ritual together make this one of Odisha's treasured Shakti shrines.", image: "/temple.svg", order: 2 },
      { id: uuid(), slug: "banki-mahotsav", title: "Banki Mahotsav", subtitle: "Literature, folk arts & social harmony", excerpt: "Banki Mahotsav is more than a fair — it is a living festival of Odia literature, folk performance, Charchika Samman, and community pride.", body: "Held in Banki, Odisha, the Mahotsav brings together artistes, writers, devotees, and families. Silver-jubilee editions have drawn state leadership and highlighted Banki's cultural depth. Stages host Odissi, pala, sankirtan, and local crafts. The festival also supports social cohesion and local enterprise, while keeping Maa Charchika at the centre of public life.", image: "/festival.svg", order: 3 },
    ],
    pujas: [
      { id: uuid(), slug: "charchika-special-puja", title: "Charchika Special Puja", category: "All Type of Puja", price: 2100, duration: "45 mins", featured: true, description: "Complete special puja at Charchika shrine with sankalp in the devotee's name, pushpanjali, and prasad.", image: "/temple.svg" },
      { id: uuid(), slug: "anjali-puja", title: "Anjali Puja", category: "Anjali Puja", price: 501, duration: "20 mins", featured: true, description: "Name-sankalp anjali offered to Maa Charchika with flowers, sindoor, and lamp.", image: "/temple.svg" },
      { id: uuid(), slug: "hawan-puja", title: "Hawan Puja", category: "Hawan Puja", price: 5100, duration: "90 mins", featured: true, description: "Hawan with Charchika mantras for health, protection, and family welfare.", image: "/temple.svg" },
      { id: uuid(), slug: "monthly-puja", title: "Monthly Puja Seva", category: "Monthly Puja", price: 1100, duration: "Monthly", featured: false, description: "Recurring monthly puja on a chosen tithi, with photo/video confirmation when possible.", image: "/temple.svg" },
      { id: uuid(), slug: "mahotsav-event-puja", title: "Mahotsav Event Puja", category: "Events Puja", price: 2500, duration: "Festival day", featured: true, description: "Special booking during Banki Mahotsav cultural days with event-day darshan seva.", image: "/festival.svg" },
    ],
    offerings: [
      { id: uuid(), slug: "saree-offering", title: "Saree Offering", price: 1500, description: "Offer a saree to Maa Charchika on your behalf during puja.", image: "/prasad.svg" },
      { id: uuid(), slug: "bhog-prasad", title: "Bhog & Prasad", price: 751, description: "Temple-style bhog offering with shareable prasad packing when requested.", image: "/prasad.svg" },
      { id: uuid(), slug: "deepa-seva", title: "Deepa Seva", price: 251, description: "Evening lamp seva in the devotee's name.", image: "/temple.svg" },
    ],
    products: [
      { id: uuid(), slug: "charchika-tabij-protection", title: "Charchika Tabij for Protection", price: 1299, category: "Tabij", consecrated: true, stock: 40, description: "Consecrated protection tabij energised during Charchika puja.", image: "/locket.svg" },
      { id: uuid(), slug: "charchika-tabij-study", title: "Charchika Tabij for Study", price: 1199, category: "Tabij", consecrated: true, stock: 35, description: "For students and competitive exams, consecrated on Ashtami.", image: "/locket.svg" },
      { id: uuid(), slug: "charchika-yantra", title: "Charchika Yantra", price: 899, category: "Yantra", consecrated: true, stock: 50, description: "Copper yantra consecrated at the shrine.", image: "/locket.svg" },
      { id: uuid(), slug: "maa-locket", title: "Maa Charchika Locket", price: 1499, category: "Locket", consecrated: true, stock: 25, description: "Pendant locket for daily wear after puja.", image: "/locket.svg" },
      { id: uuid(), slug: "festival-prasad-box", title: "Mahotsav Prasad Box", price: 499, category: "Prasad", consecrated: false, stock: 80, description: "Festival prasad assortment packed for devotees at home.", image: "/prasad.svg" },
      { id: uuid(), slug: "silver-locket", title: "Silver Charchika Locket", price: 2499, category: "Locket", consecrated: true, stock: 15, description: "Silver locket consecrated during special hawan.", image: "/locket.svg" },
    ],
    events: [
      festivalSeed()[0],
    ],
    reviews: [
      { id: uuid(), name: "Smita Rath", rating: 5, text: "Booked Anjali Puja during Mahotsav. Confirmation and prasad details were shared the same evening. Jai Maa Charchika.", approved: true, reactions: { like: 4, love: 2, clap: 1 }, createdAt: now() },
      { id: uuid(), name: "Debasish Mohanty", rating: 5, text: "The store tabij arrived consecrated as promised. The festival pages helped our family plan the visit.", approved: true, reactions: { like: 2, love: 1, clap: 0 }, createdAt: now() },
      { id: uuid(), name: "Anita Das", rating: 4, text: "Smooth booking for monthly puja. Would love more photos of the cultural stage next year.", approved: true, reactions: { like: 1, love: 0, clap: 1 }, createdAt: now() },
    ],
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
  for (const h of data.history) await insertRow("history", h);
  for (const p of data.pujas) await insertRow("pujas", p);
  for (const o of data.offerings) await insertRow("offerings", o);
  for (const p of data.products) await insertRow("products", p);
  for (const e of data.events) await insertRow("events", e);
  for (const r of data.reviews) await insertRow("reviews", r);
  for (const n of newsSeed()) await insertRow("news", n);
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
