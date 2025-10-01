// index.js - servidor con vistas EJS, login y rutas para trámites
const express = require("express");
const session = require("express-session");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

// Config EJS y carpeta de vistas / public
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Middlewares para recibir JSON y formularios HTML
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session - usa una variable de entorno en producción
const SESSION_SECRET = process.env.SESSION_SECRET || "cambiame_en_produccion";
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 } // 4 horas
}));

// Credenciales admin (en producción, setear env vars en Render)
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "1234";

// Helpers para leer / guardar datos en data.json
async function readData() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(content || "[]");
  } catch (err) {
    if (err.code === "ENOENT") return []; // archivo no existe aún
    throw err;
  }
}
async function saveData(arr) {
  await fs.writeFile(DATA_FILE, JSON.stringify(arr, null, 2));
}

// Middleware de autenticación
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect("/login");
}

// Útil para calcular días y estado
function computeStatus(fechaStr) {
  const hoy = new Date();
  const fv = new Date(fechaStr + "T00:00:00"); // asegurar zona
  const diffMs = fv - hoy;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { status: "Vencido", diffDays };
  if (diffDays <= 7) return { status: "Por vencer (<=7)", diffDays };
  if (diffDays <= 30) return { status: "Próximo (<=30)", diffDays };
  return { status: "Vigente", diffDays };
}

// Rutas públicas / login
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.user = { username };
    return res.redirect("/dashboard");
  }
  return res.render("login", { error: "Usuario o contraseña incorrectos" });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Ruta principal: si está autenticado va al dashboard
app.get("/", (req, res) => {
  if (req.session && req.session.user) return res.redirect("/dashboard");
  return res.redirect("/login");
});

// Dashboard (protegido)
app.get("/dashboard", requireAuth, async (req, res) => {
  const data = await readData();
  const hoy = new Date();
  const total = data.length;
  const vencidos = data.filter(t => new Date(t.fecha_vencimiento) < hoy).length;
  const proximos = data.filter(t => {
    const fv = new Date(t.fecha_vencimiento);
    const limite = new Date();
    limite.setDate(hoy.getDate() + 30);
    return fv >= hoy && fv <= limite;
  }).length;

  res.render("dashboard", { user: req.session.user, stats: { total, vencidos, proximos } });
});

// Formulario web para crear trámites (vista)
app.get("/form", requireAuth, (req, res) => {
  res.render("form", { user: req.session.user });
});

// POST /tramites -> recibe JSON o formulario y guarda en data.json
app.post("/tramites", requireAuth, async (req, res) => {
  try {
    const { nombre, documento, tramite, fecha_vencimiento } = req.body;
    if (!nombre || !documento || !tramite || !fecha_vencimiento) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const data = await readData();
    const id = Date.now();
    const nuevo = {
      id,
      nombre,
      documento,
      tramite,
      fecha_vencimiento,
      estado: "Vigente",
      creado: new Date().toISOString(),
    };
    data.push(nuevo);
    await saveData(data);

    // Si vino desde formulario HTML, redirige a la lista
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect("/tramites");
    }

    return res.status(201).json({ success: true, id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al guardar" });
  }
});

// GET /tramites -> si es navegador devuelve la vista; si es API, JSON
app.get("/tramites", requireAuth, async (req, res) => {
  const data = await readData();
  // enriquecer con estado y dias restantes
  const enriched = data.map(t => {
    const { status, diffDays } = computeStatus(t.fecha_vencimiento);
    return { ...t, status, diffDays };
  });

  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    return res.render("tramites", { user: req.session.user, tramites: enriched });
  }

  return res.json(enriched);
});

// Borrar trámite por id (enlace simple)
app.get("/tramites/delete/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const data = await readData();
  const nuevo = data.filter(t => t.id !== id);
  await saveData(nuevo);
  res.redirect("/tramites");
});

// GET /recordatorios -> vista o JSON de próximos 30 días
app.get("/recordatorios", requireAuth, async (req, res) => {
  const data = await readData();
  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() + 30);

  const proximos = data
    .map(t => ({ ...t, ...computeStatus(t.fecha_vencimiento) }))
    .filter(t => {
      const fv = new Date(t.fecha_vencimiento);
      return fv >= hoy && fv <= limite;
    });

  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    return res.render("recordatorios", { user: req.session.user, proximos });
  }

  return res.json({ proximos, count: proximos.length });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});









