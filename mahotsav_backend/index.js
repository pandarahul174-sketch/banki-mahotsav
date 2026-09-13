require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const db = require("./db");
const { sendContactMail } = require("./mail");

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
  limits: { fileSize: 25 * 1024 * 1024 },
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

function publicOnly(rows) {
  return (rows || []).filter((row) => row.active !== false);
}

app.get("/api/site", wrap(async (_req, res) => {
  const [settings, events, gallery, books] = await Promise.all([
    db.getSettings(),
    db.list("events", "ORDER BY sort_order ASC, title ASC"),
    db.list("gallery", "ORDER BY sort_order ASC"),
    db.list("books", "ORDER BY sort_order ASC, title ASC"),
  ]);
  res.json({ settings, events: publicOnly(events), gallery: publicOnly(gallery), books: publicOnly(books) });
}));

app.get("/api/gallery", wrap(async (_req, res) => {
  res.json(publicOnly(await db.list("gallery", "ORDER BY sort_order ASC")));
}));

app.get("/api/events/:slug", wrap(async (req, res) => {
  const item = await db.findBy("events", "slug", req.params.slug);
  if (!item || item.active === false) return res.status(404).json({ error: "Not found" });
  res.json(item);
}));

app.get("/api/books/:slug", wrap(async (req, res) => {
  const item = await db.findBy("books", "slug", req.params.slug);
  if (!item || item.active === false) return res.status(404).json({ error: "Not found" });
  res.json(item);
}));

app.get("/api/me", auth(), wrap(async (req, res) => {
  res.json({ user: publicUser(req.user) });
}));

app.post("/api/contact", wrap(async (req, res) => {
  const { name, email, phone, message } = req.body || {};
  const nameVal = String(name || "").trim();
  if (nameVal.length < 2 || nameVal.length > 80 || !/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{0,79}$/u.test(nameVal)) {
    return res.status(400).json({ error: "Enter a valid name using letters only" });
  }
  if (!message || !String(message).trim()) return res.status(400).json({ error: "Message is required" });
  if (String(message).trim().length < 10) return res.status(400).json({ error: "Message must be at least 10 characters" });
  if (String(message).length > 1000) return res.status(400).json({ error: "Message cannot exceed 1000 characters" });
  const emailVal = String(email || "").trim();
  if (emailVal.length > 100 || !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(emailVal)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }
  const digits = String(phone || "").replace(/\D/g, "");
  const ten = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  if (!/^[6-9]\d{9}$/.test(ten)) {
    return res.status(400).json({ error: "Enter a valid 10-digit mobile number" });
  }
  await db.insertRow("messages", { id: db.uuid(), name: nameVal, email: emailVal, phone: String(phone).trim(), message: String(message).trim(), read: false, createdAt: db.now() });
  const settings = await db.getSettings();
  const to = (settings?.contactEmail || settings?.email || "").trim();
  try {
    await sendContactMail({
      to,
      siteName: settings?.siteName,
      name,
      email,
      phone,
      message,
    });
  } catch (err) {
    console.error("Contact email failed:", err.message);
  }
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
  const [[events], [books], [gallery], [messages]] = await Promise.all([
    db.query("SELECT COUNT(*) AS n FROM events"),
    db.query("SELECT COUNT(*) AS n FROM books"),
    db.query("SELECT COUNT(*) AS n FROM gallery"),
    db.query("SELECT COUNT(*) AS n FROM messages"),
  ]);
  res.json({
    events: events.n,
    books: books.n,
    gallery: gallery.n,
    messages: messages.n,
  });
}));

const collections = ["events", "books", "gallery", "messages"];

app.get("/api/admin/:col", auth("admin"), wrap(async (req, res) => {
  const col = req.params.col;
  if (col === "settings") return res.json(await db.getSettings());
  if (col === "users") {
    const users = await db.list("users", "ORDER BY created_at DESC");
    return res.json(users.map(publicUser));
  }
  if (!collections.includes(col)) return res.status(404).json({ error: "Unknown collection" });
  let extra = "";
  if (col === "gallery" || col === "events" || col === "books") extra = "ORDER BY sort_order ASC, title ASC";
  else if (col === "messages") extra = "ORDER BY created_at DESC";
  res.json(await db.list(col, extra));
}));

app.put("/api/admin/settings", auth("admin"), wrap(async (req, res) => {
  res.json(await db.saveSettings(req.body));
}));

app.put("/api/admin/password", auth("admin"), wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }
  if (!bcrypt.compareSync(String(currentPassword), req.user.password || "")) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }
  await db.updateRow("users", req.user.id, { password: bcrypt.hashSync(String(newPassword), 10) });
  res.json({ ok: true });
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
  if (col === "messages" && !item.createdAt) item.createdAt = db.now();
  if ((col === "events" || col === "gallery" || col === "books") && (item.order == null || item.order === "")) {
    const table = col === "gallery" ? "gallery" : col === "books" ? "books" : "events";
    const [{ n }] = await db.query(`SELECT COALESCE(MAX(sort_order), 0) AS n FROM \`${table}\``);
    item.order = Number(n) + 1;
  }
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
