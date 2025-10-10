import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  Gauge,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  List,
  Mail,
  BarChart2,
  Settings,
  UserCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

// Importar vistas
import Dashboard from "./views/Dashboard.jsx";

const Clientes = () => <div className="p-6">👥 Gestión de clientes</div>;
const Licencias = () => <div className="p-6">📄 Gestión de licencias y refrendaciones</div>;
const Chat = () => <div className="p-6">💬 Centro de comunicación</div>;
const Calendario = () => <div className="p-6">📅 Agenda y actividades</div>;
const Lista = () => <div className="p-6">📋 Lista y Organización</div>;
const Correo = () => <div className="p-6">📧 Bandeja de correo</div>;
const Reportes = () => <div className="p-6">📈 Estadísticas y reportes</div>;
const Configuracion = () => <div className="p-6">⚙️ Configuración del sistema</div>;
const Perfil = () => <div className="p-6">👤 Perfil de usuario</div>;

export default function ConfiautosCRM() {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { name: "Dashboard", icon: <Gauge size={20} />, path: "/" },
    { name: "Clientes", icon: <Users size={20} />, path: "/clientes" },
    { name: "Licencias", icon: <FileText size={20} />, path: "/licencias" },
    { name: "Chat", icon: <MessageSquare size={20} />, path: "/chat" },
    { name: "Calendario", icon: <Calendar size={20} />, path: "/calendario" },
    { name: "Lista", icon: <List size={20} />, path: "/lista" },
    { name: "Correo", icon: <Mail size={20} />, path: "/correo" },
    { name: "Reportes", icon: <BarChart2 size={20} />, path: "/reportes" },
    { name: "Configuración", icon: <Settings size={20} />, path: "/configuracion" },
    { name: "Perfil", icon: <UserCircle2 size={20} />, path: "/perfil" },
  ];

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <motion.aside
          animate={{ width: isOpen ? 240 : 80 }}
          className="bg-[#0c0f2d] text-white flex flex-col p-3 transition-all duration-300 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            {isOpen && <h1 className="text-lg font-bold tracking-wide">ConfiAutos CRM</h1>}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white"
            >
              ☰
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item, i) => (
              <Link
                key={i}
                to={item.path}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a2150] transition"
              >
                {item.icon}
                {isOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>
        </motion.aside>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/licencias" element={<Licencias />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/lista" element={<Lista />} />
            <Route path="/correo" element={<Correo />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/perfil" element={<Perfil />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
