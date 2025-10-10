import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./views/Login.jsx";
import DashboardLayout from "./views/DashboardLayout.jsx";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
        {isLoggedIn && <Route path="/*" element={<DashboardLayout />} />}
      </Routes>
    </Router>
  );
}



