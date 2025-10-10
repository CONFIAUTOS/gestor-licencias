// ConfiAutosCRMFull.jsx
// Un solo archivo React que incluye: Login (siempre), panel full-width,
// persistencia local (localStorage), auto-logout (10 min) con advertencia 1 min antes.
// Logo: /assets/img/LOGO_CONFIAUTOS.png

import React, { useEffect, useState, useRef } from "react";

const API_URL = process.env.REACT_APP_API_URL || "https://gestor.confiautos.com";
const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutos
const WARNING_BEFORE = 1 * 60 * 1000; // 1 minuto antes de cerrar

// Helpers localStorage keys
const LS_USERS = "confia_users";
const LS_CLIENTS = "confia_clients";
const LS_LICENSES = "confia_licenses";
const LS_SESSION = "confia_session";

// Inicializar admin si no existe
function ensureAdminUser() {
  const raw = localStorage.getItem(LS_USERS);
  let users = raw ? JSON.parse(raw) : [];
  if (!users.find((u) => u.username === "admin")) {
    users.push({ id: Date.now(), username: "admin", password: "1234", role: "admin", name: "Admin ConfiAutos" });
    localStorage.setItem(LS_USERS, JSON.stringify(users));
  }
}
ensureAdminUser();

/* Small UI atoms */
const Badge = ({ children, className = "" }) => (
  <span className={`px-2 py-1 rounded-full text-xs ${className}`}>{children}</span>
);

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-500">Cerrar</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

/* Login Screen */
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const raw = localStorage.getItem(LS_USERS);
    const users = raw ? JSON.parse(raw) : [];
    const u = users.find((x) => x.username === username && x.password === password);
    if (!u) {
      setError("Usuario o contraseña inválidos.");
      return;
    }
    // crear sesión
    const session = { username: u.username, name: u.name, loggedAt: Date.now(), lastActivity: Date.now() };
    localStorage.setItem(LS_SESSION, JSON.stringify(session));
    onLogin(session);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "linear-gradient(180deg,#0f2b4a,#1a365d)" }}>
      <div className="max-w-md mx-auto text-center p-8">
        <div className="bg-white/6 rounded-3xl p-8 shadow-lg backdrop-blur">
          <div className="mb-6">
            <img src="/assets/img/LOGO_CONFIAUTOS.png" alt="ConfiAutos" className="mx-auto w-40 h-auto" />
          </div>
          <h2 className="text-white text-2xl font-bold">Ingreso al sistema</h2>
          <p className="text-white/80 mt-3">Ingresa con tu usuario y contraseña para acceder al CRM</p>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border p-3 rounded mb-3" placeholder="Usuario" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full border p-3 rounded" placeholder="Contraseña" />
            </div>

            {error && <div className="text-sm text-red-500 mt-3">{error}</div>}

            <div className="mt-6 flex justify-center gap-3">
              <button type="submit" className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold">Iniciar sesión</button>
            </div>
            <div className="mt-4 text-sm text-white/70">© 2025 ConfiAutos — Gestión Inteligente</div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* Small forms */
function CreateClientForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  return (
    <div>
      <div className="grid grid-cols-1 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className="border p-2 rounded" placeholder="Nombre completo" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="border p-2 rounded" placeholder="Teléfono" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 rounded" placeholder="Correo" />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded border">Cancelar</button>
        <button onClick={() => onSubmit({ name, phone, email })} className="px-3 py-2 rounded bg-blue-600 text-white">Guardar</button>
      </div>
    </div>
  );
}

function CreateLicenseForm({ onSubmit, onCancel }) {
  const [clientName, setClientName] = useState("");
  const [type, setType] = useState("SOAT");
  const [expires, setExpires] = useState("");
  return (
    <div>
      <div className="grid grid-cols-1 gap-3">
        <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="border p-2 rounded" placeholder="Cliente (nombre)" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="border p-2 rounded">
          <option>SOAT</option>
          <option>Licencia Comercial</option>
          <option>Certificado</option>
        </select>
        <input value={expires} onChange={(e) => setExpires(e.target.value)} type="date" className="border p-2 rounded" />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded border">Cancelar</button>
        <button onClick={() => onSubmit({ client: clientName, type, expires, state: 'Vigente' })} className="px-3 py-2 rounded bg-amber-500 text-white">Guardar</button>
      </div>
    </div>
  );
}

/* Main App */
export default function ConfiAutosCRMFull() {
  const [session, setSession] = useState(() => {
    const s = localStorage.getItem(LS_SESSION);
    return s ? JSON.parse(s) : null;
  });

  // data states (persisted)
  const [clients, setClients] = useState(() => {
    const raw = localStorage.getItem(LS_CLIENTS);
    return raw ? JSON.parse(raw) : [];
  });
  const [licenses, setLicenses] = useState(() => {
    const raw = localStorage.getItem(LS_LICENSES);
    return raw ? JSON.parse(raw) : [];
  });

  // UI state
  const [modal, setModal] = useState({ open: false, title: "", content: null });
  const [notification, setNotification] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState({ dashboard: true });
  const [activeModule, setActiveModule] = useState("dashboard");
  const [activeSubmodule, setActiveSubmodule] = useState("kpis");

  // inactivity state
  const warningTimeoutRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const activityEvents = useRef(["mousemove", "keydown", "click", "touchstart"]);
  const [warningOpen, setWarningOpen] = useState(false);

  // ensure session behaves even after reload
  useEffect(() => {
    localStorage.setItem(LS_CLIENTS, JSON.stringify(clients));
  }, [clients]);
  useEffect(() => {
    localStorage.setItem(LS_LICENSES, JSON.stringify(licenses));
  }, [licenses]);

  // show notification helper
  function showNotification(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  }

  // login handler from LoginScreen
  function handleLogin(s) {
    setSession(s);
    localStorage.setItem(LS_SESSION, JSON.stringify(s));
    setupActivityTracking(); // iniciar control de inactividad
  }

  // logout
  function handleLogout() {
    // limpiar sesión
    localStorage.removeItem(LS_SESSION);
    setSession(null);
    clearActivityTracking();
    showNotification("Sesión cerrada");
  }

  // create client (localStorage)
  function createClient(data) {
    const newClient = { id: Date.now(), ...data };
    setClients((p) => [...p, newClient]);
    showNotification("Cliente creado y guardado localmente");
    setModal({ open: false });
  }

  function createLicense(data) {
    const newLic = { id: Date.now(), ...data };
    setLicenses((p) => [...p, newLic]);
    showNotification("Licencia creada y guardada localmente");
    setModal({ open: false });
  }

  // Activity & auto-logout logic
  function clearActivityTracking() {
    activityEvents.current.forEach((ev) => window.removeEventListener(ev, resetActivityTimer));
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
  }

  function resetActivityTimer() {
    // update lastActivity in session storage
    const sRaw = localStorage.getItem(LS_SESSION);
    if (sRaw) {
      const s = JSON.parse(sRaw);
      s.lastActivity = Date.now();
      localStorage.setItem(LS_SESSION, JSON.stringify(s));
      setSession(s);
    }
    // clear and set new timers
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    // warning at INACTIVITY_LIMIT - WARNING_BEFORE
    warningTimeoutRef.current = setTimeout(() => {
      // open warning modal
      setWarningOpen(true);
    }, INACTIVITY_LIMIT - WARNING_BEFORE);
    // logout at INACTIVITY_LIMIT
    logoutTimeoutRef.current = setTimeout(() => {
      setWarningOpen(false);
      handleLogout();
    }, INACTIVITY_LIMIT);
  }

  function setupActivityTracking() {
    resetActivityTimer();
    activityEvents.current.forEach((ev) => window.addEventListener(ev, resetActivityTimer));
  }

  useEffect(() => {
    // If there's an active session when mounting, start tracking
    if (session) {
      setupActivityTracking();
    }
    return () => clearActivityTracking();
    // eslint-disable-next-line
  }, [session]);

  // Sidebar modules (same structure as before, minimal for demo)
  const MODULES = [
    { key: "dashboard", label: "Dashboard", submodules: [{ key: "kpis", label: "KPIs y métricas" }, { key: "expiring", label: "Licencias por vencer" }, { key: "clients_status", label: "Clientes activos / inactivos" }, { key: "tasks", label: "Recordatorios y tareas" }] },
    { key: "clients", label: "Leads / Clientes", submodules: [{ key: "list", label: "Listado general" }, { key: "new", label: "Nuevo lead" }, { key: "tags", label: "Etiquetas y filtros" }, { key: "history", label: "Historial de comunicación" }] },
    { key: "licenses", label: "Licencias / Refrendaciones", submodules: [{ key: "all", label: "Todas las licencias" }, { key: "renewals", label: "Renovaciones" }, { key: "due", label: "Por vencer / vencidas" }, { key: "pipeline", label: "Pipeline visual" }, { key: "docs", label: "Documentos adjuntos" }] },
    { key: "chat", label: "Chat / Comunicación", submodules: [{ key: "internal", label: "Chat interno" }, { key: "whatsapp", label: "WhatsApp" }, { key: "email", label: "Correo" }, { key: "inbox", label: "Bandeja unificada" }] },
    { key: "calendar", label: "Calendario / Actividades", submodules: [{ key: "month", label: "Vista mensual" }, { key: "week", label: "Vista semanal" }, { key: "day", label: "Vista diaria" }, { key: "tasks_assign", label: "Tareas asignadas" }] },
    { key: "lists", label: "Listas / Organización", submodules: [{ key: "client_lists", label: "Listas de clientes" }, { key: "license_lists", label: "Listas de licencias" }, { key: "exports", label: "Exportar" }, { key: "labels", label: "Etiquetas" }] },
    { key: "email_module", label: "Correo / Email Marketing", submodules: [{ key: "create_campaign", label: "Crear campaña" }, { key: "templates", label: "Plantillas" }, { key: "stats", label: "Estadísticas" }, { key: "scheduled", label: "Envíos programados" }] },
    { key: "reports", label: "Estadísticas / Reportes", submodules: [{ key: "overview", label: "Resumen general" }, { key: "monthly", label: "Reportes mensuales" }, { key: "user_perf", label: "Productividad por usuario" }, { key: "licenses_state", label: "Licencias por estado" }] },
    { key: "settings", label: "Configuración", submodules: [{ key: "users", label: "Usuarios y roles" }, { key: "permissions", label: "Permisos" }, { key: "workflows", label: "Automatizaciones (Workflows)" }, { key: "branding", label: "Personalización visual" }, { key: "templates", label: "Plantillas de mensajes" }, { key: "global", label: "Parámetros generales" }] },
    { key: "profile", label: "Perfil", submodules: [{ key: "me", label: "Datos personales" }, { key: "password", label: "Cambiar contraseña" }, { key: "sessions", label: "Historial de accesos" }, { key: "logout", label: "Cerrar sesión" }] }
  ];

  // UI actions
  function toggleModule(key) {
    setSidebarExpanded((p) => ({ ...p, [key]: !p[key] }));
    setActiveModule(key);
    const mod = MODULES.find((m) => m.key === key);
    if (mod && mod.submodules && mod.submodules.length) setActiveSubmodule(mod.submodules[0].key);
  }
  function openSubmodule(moduleKey, subKey) {
    setActiveModule(moduleKey);
    setActiveSubmodule(subKey);
  }

  // Render content depending on active module/submodule (simplified, empty-state aware)
  function renderMain() {
    const key = `${activeModule}:${activeSubmodule}`;
    switch (key) {
      case "dashboard:kpis":
        return (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow"><div className="text-xs text-slate-500">Licencias activas</div><div className="text-2xl font-semibold">{licenses.length}</div></div>
              <div className="bg-white rounded-2xl p-4 shadow"><div className="text-xs text-slate-500">Por vencer (30 días)</div><div className="text-2xl font-semibold">0</div></div>
              <div className="bg-white rounded-2xl p-4 shadow"><div className="text-xs text-slate-500">Renovadas (mes)</div><div className="text-2xl font-semibold">0</div></div>
              <div className="bg-white rounded-2xl p-4 shadow"><div className="text-xs text-slate-500">Nuevos clientes</div><div className="text-2xl font-semibold">{clients.length}</div></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                {licenses.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 shadow text-center">
                    <div className="text-lg font-semibold mb-2">Aún no tienes licencias registradas</div>
                    <div className="text-sm text-slate-500 mb-4">Crea tu primera licencia para comenzar a usar el sistema.</div>
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setModal({ open: true, title: "Crear nueva licencia", content: (<CreateLicenseForm onSubmit={createLicense} onCancel={() => setModal({ open: false })} />) })} className="px-4 py-2 rounded bg-amber-500 text-white">Nueva licencia</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-4 shadow">[Tabla de licencias]</div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-4 shadow"><div className="font-semibold">Actividad reciente</div><div className="text-sm text-slate-500 mt-2">Aquí aparecerán las acciones del equipo.</div></div>
            </div>
          </div>
        );

      case "clients:list":
        return clients.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow text-center">
            <div className="text-lg font-semibold mb-2">Aún no tienes clientes registrados</div>
            <div className="text-sm text-slate-500 mb-4">Comienza agregando tu primer cliente. Los datos se guardarán localmente y pueden sincronizarse con el portal.</div>
            <div className="flex justify-center gap-2">
              <button onClick={() => setModal({ open: true, title: "Crear nuevo cliente", content: (<CreateClientForm onSubmit={createClient} onCancel={() => setModal({ open: false })} />) })} className="px-4 py-2 rounded bg-blue-600 text-white">Nuevo cliente</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow">[Pipeline de clientes]</div>
        );

      case "clients:new":
        return <div className="bg-white rounded-2xl p-4 shadow"><div className="font-semibold">Crear nuevo lead</div><div className="mt-3"><CreateClientForm onSubmit={createClient} onCancel={() => showNotification("Creación cancelada")} /></div></div>;

      case "licenses:pipeline":
        return licenses.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow text-center">
            <div className="text-lg font-semibold mb-2">Aún no tienes licencias</div>
            <div className="text-sm text-slate-500 mb-4">Agrega tu primera licencia para comenzar.</div>
            <div className="flex justify-center gap-2">
              <button onClick={() => setModal({ open: true, title: "Crear nueva licencia", content: (<CreateLicenseForm onSubmit={createLicense} onCancel={() => setModal({ open: false })} />) })} className="px-4 py-2 rounded bg-amber-500 text-white">Nueva licencia</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow">[Pipeline de licencias]</div>
        );

      case "chat:inbox":
        return <div className="bg-white rounded-2xl p-4 shadow"><div className="font-semibold">Bandeja unificada</div><div className="mt-3 text-sm text-slate-500">Conecta tu WhatsApp Business API y correo para ver mensajes aquí.</div></div>;

      case "calendar:month":
        return <div className="bg-white rounded-2xl p-4 shadow"><div className="font-semibold">Calendario</div><div className="mt-3 text-sm text-slate-500">Sincroniza Google Calendar en configuración.</div></div>;

      case "email_module:create_campaign":
        return <div className="bg-white rounded-2xl p-4 shadow"><div className="font-semibold">Crear campaña</div><div className="mt-3 text-sm text-slate-500">Editor listo para integrar (TinyMCE/Quill).</div><div className="mt-4"><button onClick={() => showNotification("Campaña programada (simulado)")} className="px-3 py-2 rounded bg-amber-500 text-white">Programar</button></div></div>;

      case "reports:overview":
        return <div className="bg-white rounded-2xl p-4 shadow"><div className="font-semibold">Reportes</div><div className="mt-3 text-sm text-slate-500">Crea reportes personalizados aquí.</div></div>;

      case "settings:workflows":
        return <div className="bg-white rounded-2xl p-4 shadow"><div className="font-semibold">Automatizaciones</div><div className="mt-3 text-sm text-slate-500">Editor visual recomendado: react-flow.</div></div>;

      case "settings:users":
        return <div className="bg-white rounded-2xl p-4 shadow"><div className="font-semibold">Usuarios y roles</div><div className="mt-3 text-sm text-slate-500">Invita a tu equipo y asigna permisos.</div><div className="mt-4"><button onClick={() => showNotification("Invitación enviada (simulado)")} className="px-3 py-2 rounded bg-blue-600 text-white">Invitar usuario</button></div></div>;

      case "profile:me":
        return <div className="bg-white rounded-2xl p-4 shadow"><div className="font-semibold">Mi perfil</div><div className="mt-3 text-sm text-slate-500">Editar datos personales.</div></div>;

      default:
        return <div className="bg-white rounded-2xl p-4 shadow"><div className="font-semibold">Selecciona un submódulo</div><div className="mt-3 text-sm text-slate-500">Usa el menú lateral para navegar.</div></div>;
    }
  }

  // Render
  return (
    <div className="min-h-screen w-screen h-screen bg-gradient-to-b from-sky-50 to-white text-slate-900">

      {!session ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <>
          <div className="w-full h-full grid grid-cols-[260px_1fr] gap-6">

            {/* Sidebar */}
            <aside className="bg-white rounded-none p-4 shadow h-full overflow-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-amber-400 p-2 rounded-lg text-white font-bold">CA</div>
                <div>
                  <div className="font-bold">ConfiAutos</div>
                  <div className="text-xs text-slate-500">CRM - Gestión de licencias</div>
                </div>
              </div>

              <nav className="flex flex-col gap-1">
                {MODULES.map((m) => (
                  <div key={m.key}>
                    <button onClick={() => toggleModule(m.key)} className={`flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-slate-100 ${activeModule === m.key ? "bg-slate-100 font-semibold" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">{m.label[0]}</div>
                        <span>{m.label}</span>
                      </div>
                      <div className="text-xs text-slate-400">{sidebarExpanded[m.key] ? "▾" : "▸"}</div>
                    </button>
                    {sidebarExpanded[m.key] && m.submodules && (
                      <div className="pl-8 mt-1 mb-2 space-y-1">
                        {m.submodules.map((s) => (
                          <button key={s.key} onClick={() => openSubmodule(m.key, s.key)} className={`w-full text-left px-2 py-1 rounded hover:bg-slate-50 ${activeModule === m.key && activeSubmodule === s.key ? "bg-slate-100 font-medium" : ""}`}>{s.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="mt-6 border-t pt-4 text-xs text-slate-500">
                <div className="mb-2">Ayuda rápida</div>
                <ul className="space-y-1">
                  <li>• Integración con portal</li>
                  <li>• Configura automatizaciones</li>
                  <li>• Exportar reportes</li>
                </ul>
              </div>
            </aside>

            {/* Main */}
            <main className="p-6 overflow-auto">
              <header className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">{MODULES.find(m => m.key === activeModule)?.label}</h1>
                  <div className="text-sm text-slate-500 mt-1">Submódulo: {MODULES.find(m => m.key === activeModule)?.submodules?.find(s => s.key === activeSubmodule)?.label || "—"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-500">{session?.name}</div>
                  <button onClick={() => showNotification("Acción rápida ejecutada")} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Acción rápida</button>
                  <button onClick={handleLogout} className="px-3 py-2 rounded-lg border">Cerrar sesión</button>
                </div>
              </header>

              <section className="space-y-6">{renderMain()}</section>
            </main>
          </div>

          {/* Modals */}
          <Modal open={modal.open} title={modal.title} onClose={() => setModal({ open: false })}>
            {modal.content}
          </Modal>

          {/* Warning modal for inactivity */}
          <Modal open={warningOpen} title={"Sesión por expirar"} onClose={() => { setWarningOpen(false); resetActivityAfterWarning(); }}>
            <div>
              <p className="text-sm text-slate-600">Tu sesión expirará en 1 minuto por inactividad. ¿Deseas continuar conectado?</p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => { setWarningOpen(false); handleLogout(); }} className="px-3 py-2 rounded border">Cerrar sesión ahora</button>
                <button onClick={() => { setWarningOpen(false); resetActivityAfterWarning(); }} className="px-3 py-2 rounded bg-blue-600 text-white">Continuar sesión</button>
              </div>
            </div>
          </Modal>

          {/* Notification toast */}
          {notification && (<div className="fixed right-6 bottom-6 bg-slate-900 text-white px-4 py-2 rounded-lg shadow">{notification}</div>)}
        </>
      )}
    </div>
  );

  // helper inside component to reset timers from warning modal
  function resetActivityAfterWarning() {
    // update lastActivity and reset timers
    const sRaw = localStorage.getItem(LS_SESSION);
    if (sRaw) {
      const s = JSON.parse(sRaw);
      s.lastActivity = Date.now();
      localStorage.setItem(LS_SESSION, JSON.stringify(s));
      setSession(s);
    }
    setWarningOpen(false);
    // reset timers
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    // restart activity tracking
    clearActivityTracking();
    setupActivityTracking();
  }
}


