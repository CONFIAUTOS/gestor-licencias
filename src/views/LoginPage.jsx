import React, { useState } from "react";
import logo from "../assets/cropped-LOGO-confiautos-2.png";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    alert(`Bienvenido ${usuario || "usuario"} 🚗`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c0f2d] to-[#1a237e]">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md text-center transform transition-all duration-300 hover:scale-[1.02]">
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="Logo ConfiAutos"
            className="w-32 h-auto object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Bienvenido al CRM de ConfiAutos
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Ingresa tu usuario y contraseña para continuar
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          />
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 rounded-lg transition duration-200 shadow-md"
          >
            Iniciar sesión
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} ConfiAutos · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}

