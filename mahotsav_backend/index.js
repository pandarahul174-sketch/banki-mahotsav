require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const db = require("./db");

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "banki-mahotsav-dev-secret";
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
      cb(null, `${Date.now()}-${db.uuid()}${ext}`);
    },
  }),
  limits: { fileSize: 6 * 1024 * 1024 },
});

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function auth(requiredRole) {
  return async (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Login required" });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await db.findBy("users", "id", payload.id);
      if (!user) return res.status(401).json({ error: "Invalid session" });
      if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
        return res.status(403).json({ error: "Not allowed" });
      }
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid session" });
    }
  };
}

function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/site", wrap(async (_req, res) => {
  const [settings, history, pujas, offerings, products, events, gallery, reviews, news] = await Promise.all([
    db.getSettings(),
    db.list("history", "ORDER BY sort_order ASC"),
    db.list("pujas"),
    db.list("offerings"),
    db.list("products"),
    db.list("events"),
    db.list("gallery", "ORDER BY sort_order ASC"),
    db.query("SELECT * FROM reviews WHERE approved = 1 ORDER BY created_at DESC").then((rows) =>
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        rating: Number(r.rating),
        text: r.text,
        approved: true,
        reactions: typeof r.reactions === "string" ? JSON.parse(r.reactions) : r.reactions || { like: 0, love: 0, clap: 0 },
        createdAt: r.created_at,
      }))
    ),
    db.list("news", "ORDER BY created_at DESC"),
  ]);
  res.json({ settings, history, pujas, offerings, products, events, gallery, reviews, news });
}));

app.get("/api/gallery", wrap(async (_req, res) => {
  res.json(await db.list("gallery", "ORDER BY sort_order ASC"));
}));

app.get("/api/events/:slug", wrap(async (req, res) => {
  const item = await db.findBy("events", "slug", req.params.slug);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
}));

app.get("/api/history/:slug", wrap(async (req, res) => {
  const item = await db.findBy("history", "slug", req.params.slug);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
}));

app.get("/api/pujas/:slug", wrap(async (req, res) => {
  const item = await db.findBy("pujas", "slug", req.params.slug);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
}));

app.get("/api/products/:slug", wrap(async (req, res) => {
  const item = await db.findBy("products", "slug", req.params.slug);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
}));

app.post("/api/auth/register", wrap(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
  const existing = await db.findBy("users", "email", email);
  if (existing) return res.status(400).json({ error: "Email already registered" });
  const user = {
    id: db.uuid(),
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    role: "devotee",
    createdAt: db.now(),
  };
  await db.insertRow("users", user);
  res.json({ token: signToken(user), user: publicUser(user) });
}));

app.post("/api/auth/login", wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await db.findBy("users", "email", String(email || "").toLowerCase());
  if (!user) {
    const rows = await db.query("SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1", [String(email || "").toLowerCase()]);
    const mapped = rows[0] ? { id: rows[0].id, name: rows[0].name, email: rows[0].email, password: rows[0].password, role: rows[0].role } : null;
    if (!mapped || !bcrypt.compareSync(password || "", mapped.password)) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    return res.json({ token: signToken(mapped), user: publicUser(mapped) });
  }
  if (!bcrypt.compareSync(password || "", user.password)) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

app.get("/api/me", auth(), wrap(async (req, res) => {
  res.json({ user: publicUser(req.user) });
}));

app.post("/api/reviews", wrap(async (req, res) => {
  const { name, rating, text } = req.body || {};
  if (!name || !text) return res.status(400).json({ error: "Name and review required" });
  await db.insertRow("reviews", {
    id: db.uuid(),
    name,
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    text,
    approved: false,
    reactions: { like: 0, love: 0, clap: 0 },
    createdAt: db.now(),
  });
  res.json({ ok: true, message: "Thank you. Your review will appear after approval." });
}));

app.post("/api/reviews/:id/react", wrap(async (req, res) => {
  const review = await db.findBy("reviews", "id", req.params.id);
  if (!review) return res.status(404).json({ error: "Not found" });
  const key = req.body.type;
  if (!["like", "love", "clap"].includes(key)) return res.status(400).json({ error: "Invalid reaction" });
  review.reactions[key] = (review.reactions[key] || 0) + 1;
  const updated = await db.updateRow("reviews", review.id, { reactions: review.reactions });
  res.json(updated);
}));

app.post("/api/bookings", wrap(async (req, res) => {
  const { name, email, phone, pujaId, date, gotra, notes } = req.body || {};
  if (!name || !phone || !pujaId) return res.status(400).json({ error: "Name, phone and puja required" });
  const puja = await db.findBy("pujas", "id", pujaId);
  if (!puja) return res.status(400).json({ error: "Puja not found" });
  const booking = {
    id: db.uuid(),
    name,
    email: email || "",
    phone,
    pujaId,
    pujaTitle: puja.title,
    amount: puja.price,
    date: date || "",
    gotra: gotra || "",
    notes: notes || "",
    status: "pending",
    createdAt: db.now(),
  };
  await db.insertRow("bookings", booking);
  res.json({ ok: true, booking });
}));

app.post("/api/orders", wrap(async (req, res) => {
  const { name, email, phone, address, items } = req.body || {};
  if (!name || !phone || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Name, phone and cart items required" });
  }
  const products = await db.list("products");
  const offerings = await db.list("offerings");
  const lines = items.map((it) => {
    const product = products.find((p) => p.id === it.id);
    const offering = offerings.find((p) => p.id === it.id);
    const src = product || offering;
    if (!src) return null;
    return { id: src.id, title: src.title, price: src.price, qty: Math.max(1, Number(it.qty) || 1), kind: product ? "product" : "offering" };
  }).filter(Boolean);
  if (!lines.length) return res.status(400).json({ error: "No valid items" });
  const order = {
    id: db.uuid(),
    name,
    email: email || "",
    phone,
    address: address || "",
    items: lines,
    total: lines.reduce((s, l) => s + l.price * l.qty, 0),
    status: "pending",
    createdAt: db.now(),
  };
  await db.insertRow("orders", order);
  res.json({ ok: true, order });
}));

app.post("/api/contact", wrap(async (req, res) => {
  const { name, email, phone, message } = req.body || {};
  if (!name || !message) return res.status(400).json({ error: "Name and message required" });
  await db.insertRow("messages", { id: db.uuid(), name, email: email || "", phone: phone || "", message, read: false, createdAt: db.now() });
  res.json({ ok: true });
}));

app.post("/api/admin/login", wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const rows = await db.query("SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1", [String(email || "").toLowerCase()]);
  const user = rows[0];
  if (!user || user.role !== "admin" || !bcrypt.compareSync(password || "", user.password)) {
    return res.status(400).json({ error: "Invalid admin credentials" });
  }
  const mapped = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ token: signToken(mapped), user: publicUser(mapped) });
}));

app.get("/api/admin/stats", auth("admin"), wrap(async (_req, res) => {
  const [[pujas], [products], [bookings], [pendingBookings], [orders], [pendingOrders], [reviews], [pendingReviews], [messages]] = await Promise.all([
    db.query("SELECT COUNT(*) AS n FROM pujas"),
    db.query("SELECT COUNT(*) AS n FROM products"),
    db.query("SELECT COUNT(*) AS n FROM bookings"),
    db.query("SELECT COUNT(*) AS n FROM bookings WHERE status = 'pending'"),
    db.query("SELECT COUNT(*) AS n FROM orders"),
    db.query("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'"),
    db.query("SELECT COUNT(*) AS n FROM reviews"),
    db.query("SELECT COUNT(*) AS n FROM reviews WHERE approved = 0"),
    db.query("SELECT COUNT(*) AS n FROM messages"),
  ]);
  res.json({
    pujas: pujas.n,
    products: products.n,
    bookings: bookings.n,
    pendingBookings: pendingBookings.n,
    orders: orders.n,
    pendingOrders: pendingOrders.n,
    reviews: reviews.n,
    pendingReviews: pendingReviews.n,
    messages: messages.n,
  });
}));

const collections = ["history", "pujas", "offerings", "products", "events", "gallery", "news", "reviews", "bookings", "orders", "messages"];

app.get("/api/admin/:col", auth("admin"), wrap(async (req, res) => {
  const col = req.params.col;
  if (col === "settings") return res.json(await db.getSettings());
  if (col === "users") {
    const users = await db.list("users", "ORDER BY created_at DESC");
    return res.json(users.map(publicUser));
  }
  if (!collections.includes(col)) return res.status(404).json({ error: "Unknown collection" });
  let extra = "";
  if (col === "history" || col === "gallery") extra = "ORDER BY sort_order ASC";
  else if (["bookings", "orders", "messages", "reviews", "news"].includes(col)) extra = "ORDER BY created_at DESC";
  res.json(await db.list(col, extra));
}));

app.put("/api/admin/settings", auth("admin"), wrap(async (req, res) => {
  res.json(await db.saveSettings(req.body));
}));

app.post("/api/admin/upload", auth("admin"), upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post("/api/admin/:col", auth("admin"), wrap(async (req, res) => {
  const col = req.params.col;
  if (!collections.includes(col)) return res.status(404).json({ error: "Unknown collection" });
  const item = { ...req.body, id: db.uuid() };
  if (!item.slug && item.title) item.slug = slugify(item.title);
  if (col === "reviews") {
    if (item.approved === undefined) item.approved = true;
    if (!item.reactions) item.reactions = { like: 0, love: 0, clap: 0 };
  }
  if (["reviews", "bookings", "orders", "messages", "news"].includes(col) && !item.createdAt) item.createdAt = db.now();
  await db.insertRow(col, item);
  const saved = await db.findBy(col, "id", item.id);
  res.json(saved);
}));

app.put("/api/admin/:col/:id", auth("admin"), wrap(async (req, res) => {
  const col = req.params.col;
  if (!collections.includes(col)) return res.status(404).json({ error: "Unknown collection" });
  const { id, ...rest } = req.body || {};
  const saved = await db.updateRow(col, req.params.id, rest);
  if (!saved) return res.status(404).json({ error: "Not found" });
  res.json(saved);
}));

app.delete("/api/admin/:col/:id", auth("admin"), wrap(async (req, res) => {
  const col = req.params.col;
  if (!collections.includes(col)) return res.status(404).json({ error: "Unknown collection" });
  await db.remove(col, req.params.id);
  res.json({ ok: true });
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

const citizenDist = path.join(__dirname, "..", "mahotsav_citizen", "dist");
if (fs.existsSync(citizenDist)) {
  app.use(express.static(citizenDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(citizenDist, "index.html"));
  });
}

db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Banki Mahotsav API on http://localhost:${PORT} (MySQL ${process.env.MYSQL_DATABASE || "banki_mahotsav"})`);
    });
  })
  .catch((err) => {
    console.error("MySQL connection failed.");
    console.error(err.message);
    console.error("Copy mahotsav_backend/.env.example to mahotsav_backend/.env and set MYSQL_USER / MYSQL_PASSWORD.");
    process.exit(1);
  });
