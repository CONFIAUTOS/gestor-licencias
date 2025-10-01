// index.js - servidor básico con rutas para tramites y recordatorios
const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data.json");

// Middlewares para recibir JSON y formularios HTML
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Ruta principal
app.get("/", (req, res) => {
  res.send("🚦 Bienvenido a tu sistema Gestor de Licencias");
});

// Formulario web simple para crear trámites (prueba en el navegador)
app.get("/form", (req, res) => {
  res.send(`
    <h2>Registrar Trámite</h2>
    <form method="POST" action="/tramites">
      <label>Nombre: <input name="nombre" required></label><br>
      <label>Documento: <input name="documento" required></label><br>
      <label>Tipo trámite: <input name="tramite" required></label><br>
      <label>Fecha vencimiento: <input type="date" name="fecha_vencimiento" required></label><br>
      <button type="submit">Guardar</button>
    </form>
    <p><a href="/tramites">Ver todos los trámites (JSON)</a></p>
  `);
});

// POST /tramites -> recibe JSON o formulario y guarda en data.json
app.post("/tramites", async (req, res) => {
  try {
    const { nombre, documento, tramite, fecha_vencimiento } = req.body;
    if (!nombre || !documento || !tramite || !fecha_vencimiento) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const data = await readData();
    const id = Date.now(); // id simple
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

    // Si vino desde formulario HTML, redirige a listado
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect("/tramites");
    }

    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar" });
  }
});

// GET /tramites -> lista todos los trámites (JSON)
app.get("/tramites", async (req, res) => {
  const data = await readData();
  res.json(data);
});

// GET /recordatorios -> trámites con vencimiento en los próximos 30 días
app.get("/recordatorios", async (req, res) => {
  const data = await readData();
  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() + 30);

  const proximos = data.filter((t) => {
    const fv = new Date(t.fecha_vencimiento);
    return fv >= hoy && fv <= limite;
  });

  res.json({ proximos, count: proximos.length });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});






