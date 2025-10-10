// server.js - ConfiAutos backend (Express + Postgres + JWT)
// Requiere environment variables:
//  - DATABASE_URL   (postgres connection string)   <-- en Render, la DB gestionada
//  - JWT_SECRET     (string largo, e.g. 32+ chars)
//  - ADMIN_USER     (ej: admin)
//  - ADMIN_PASSWORD (ej: 1234)
//  - ADMIN_NAME     (ej: Admin ConfiAutos)
//  - CORS_ORIGIN    (ej: https://crm.confiautos.com)

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(helmet());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_this";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

// Pool Postgres, con soporte SSL si hay DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Inicializar tablas si no existen
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      created_at TIMESTAMP DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      type TEXT,
      expires DATE,
      state TEXT,
      created_at TIMESTAMP DEFAULT now()
    );
  `);

  // seed admin if env provided
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Admin ConfiAutos";
  if (adminUser && adminPass) {
    const res = await pool.query("SELECT id FROM users WHERE username=$1", [adminUser]);
    if (res.rowCount === 0) {
      const hash = await bcrypt.hash(adminPass, 10);
      await pool.query("INSERT INTO users (username, password_hash, name, role) VALUES ($1,$2,$3,$4)",
        [adminUser, hash, adminName, "admin"]);
      console.log("Admin user created:", adminUser);
    } else {
      console.log("Admin user already exists");
    }
  }
}

initDb().catch(err => {
  console.error("Error initializing DB:", err);
  process.exit(1);
});

// Helpers
function createToken(user) {
  return jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "12h" });
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "Sin token" });
  const token = h.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

function adminOnly(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ error: "Se requieren permisos de administrador" });
}

// Routes
app.get("/api/ping", (req, res) => res.json({ ok: true }));

// Public: create admin via endpoint (opcional - si prefieres)
// NOTE: we already seed admin on startup if ADMIN_USER env exists.
app.post("/api/setup", async (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username y password obligatorios" });
    const exists = await pool.query("SELECT id FROM users WHERE username=$1", [username]);
    if (exists.rowCount) return res.status(400).json({ error: "Usuario ya existe" });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query("INSERT INTO users (username,password_hash,name,role) VALUES ($1,$2,$3,$4) RETURNING id, username, name, role",
      [username, hash, name || username, "admin"]);
    res.json({ ok: true, user: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error interno" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username y password obligatorios" });

    const r = await pool.query("SELECT id, username, password_hash, name, role FROM users WHERE username=$1", [username]);
    if (r.rowCount === 0) return res.status(401).json({ error: "Credenciales inválidas" });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = createToken(user);
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error interno" });
  }
});

// Users (admin only)
app.get("/api/users", authMiddleware, adminOnly, async (req, res) => {
  const r = await pool.query("SELECT id, username, name, role, created_at FROM users ORDER BY id DESC");
  res.json(r.rows);
});

app.post("/api/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username y password obligatorios" });
    const exists = await pool.query("SELECT id FROM users WHERE username=$1", [username]);
    if (exists.rowCount) return res.status(400).json({ error: "Usuario ya existe" });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query("INSERT INTO users (username,password_hash,name,role) VALUES ($1,$2,$3,$4) RETURNING id, username, name, role",
      [username, hash, name || username, role || "user"]);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error interno" });
  }
});

// Clients
app.get("/api/clients", authMiddleware, async (req, res) => {
  const r = await pool.query("SELECT id, name, phone, email, created_at FROM clients ORDER BY created_at DESC");
  res.json(r.rows);
});

app.post("/api/clients", authMiddleware, async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const r = await pool.query("INSERT INTO clients (name,phone,email) VALUES ($1,$2,$3) RETURNING id, name, phone, email, created_at", [name, phone, email]);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error interno" });
  }
});

// Licenses
app.get("/api/licenses", authMiddleware, async (req, res) => {
  const r = await pool.query(`
    SELECT l.id, l.type, l.expires, l.state, l.created_at, c.id as client_id, c.name as client_name
    FROM licenses l
    LEFT JOIN clients c ON l.client_id = c.id
    ORDER BY l.created_at DESC
  `);
  res.json(r.rows);
});

app.post("/api/licenses", authMiddleware, async (req, res) => {
  try {
    const { client_id, type, expires, state } = req.body;
    // client_id optional; can be null
    const r = await pool.query("INSERT INTO licenses (client_id,type,expires,state) VALUES ($1,$2,$3,$4) RETURNING *",
      [client_id || null, type, expires, state || "Vigente"]);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error interno" });
  }
});

app.listen(PORT, () => {
  console.log(`ConfiAutos API running on port ${PORT}`);
});
