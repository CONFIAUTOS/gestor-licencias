import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Car,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import LoginPage from "./LoginPage"; // ✅ Tu login personalizado

/* ========== Dashboard Principal ========== */
function Dashboard() {
  return (
    <div className="p-6 text-gray-800">
      <h2 className="text-3xl font-bold mb-4">Panel Principal</h2>
      <p className="text-gray-600">
        Bienvenido al CRM de ConfiAutos. Aquí podrás gestionar clientes,
        vehículos y configuraciones internas.
      </p>
    </div>
  );
}

/* ========== Gestión de Clientes ========== */
function Clientes() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Clientes</h2>
      <p className="text-gray-600">Lista de clientes registrados.</p>
    </div>
  );
}

/* ========== Gestión de Vehículos ========== */
function Vehiculos() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Vehículos</h2>
      <p className="text-gray-600">Control de inventario vehicular.</p>
    </div>
  );
}

/* ========== Configuración ========== */
function Configuracion() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Configuración</h2>
      <p className="text-gray-600">Opciones de personalización del sistema.</p>
    </div>
  );
}

/* ========== Sidebar ========== */
function Sidebar({ onLogout, toggleSidebar, isSidebarOpen }) {
  return (
    <div
      className={`${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 fixed md:static z-50 bg-[#0c0f2d] text-white w-64 h-full p-6 transition-transform duration-300 ease-in-out`}
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-yellow-400">ConfiAutos CRM</h2>
        <button onClick={toggleSidebar} className="md:hidden">
          <X size={22} />
        </button>
      </div>

      <nav className="space-y-3">
        <Link
          to="/"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-yellow-500 hover:text-gray-900 transition"
        >
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        <Link
          to="/clientes"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-yellow-500 hover:text-gray-900 transition"
        >
          <Users size={20} /> Clientes
        </Link>
        <Link
          to="/vehiculos"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-yellow-500 hover:text-gray-900 transition"
        >
          <Car size={20} /> Vehículos
        </Link>
        <Link
          to="/configuracion"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-yellow-500 hover:text-gray-900 transition"
        >
          <Settings size={20} /> Configuración
        </Link>
      </nav>

      <button
        onClick={onLogout}
        className="flex items-center gap-2 bg-yellow-500 text-gray-900 px-4 py-2 mt-10 rounded-lg hover:bg-yellow-400 transition w-full"
      >
        <LogOut size={18} /> Cerrar sesión
      </button>
    </div>
  );
}

/* ========== Layout principal ========== */
function MainLayout({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        onLogout={onLogout}
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex-1">
        <header className="flex items-center justify-between bg-white shadow-md p-4">
          <button
            className="md:hidden text-gray-700"
            onClick={toggleSidebar}
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            Sistema de Gestión ConfiAutos
          </h1>
        </header>
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/vehiculos" element={<Vehiculos />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ========== App principal con Login ========== */
export default function ConfiAutosCRMFull() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("confia_session");
    if (stored) setSession(JSON.parse(stored));
  }, []);

  const handleLogin = (userData) => {
    setSession(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("confia_session");
    setSession(null);
  };

  return (
    <Router>
      {!session ? (
        <LoginPage onLogin={handleLogin} /> // ✅ Usa tu login personalizado
      ) : (
        <MainLayout onLogout={handleLogout} />
      )}
    </Router>
  );
}
