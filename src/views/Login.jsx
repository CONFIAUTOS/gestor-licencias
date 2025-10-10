import React, { useState } from "react";
import "./../styles/Login.css";
import logo from "./../assets/LOGO_CONFIAUTOS.png";
import { useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (usuario === "admin" && contrasena === "1234") {
      onLogin();
      navigate("/dashboard");
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Logo ConfiAutos" className="login-logo" />
        <h2>Ingreso al sistema</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="login-input"
          />
          <button type="submit" className="login-button">
            Iniciar Sesión
          </button>
        </form>
        <p className="login-footer">
          © 2025 <strong>ConfiAutos</strong> — Gestión Inteligente
        </p>
      </div>
    </div>
  );
}
