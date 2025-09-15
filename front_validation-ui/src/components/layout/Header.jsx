// src/components/shared/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';
import './Header.css';
import logo from '../../assets/LDE_Logo_GRP_RVB_VH.svg';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Gère la fermeture du dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="app-header">
      <div className="header-content">
        {/* --- ZONE GAUCHE : Logo et Titre --- */}
        <NavLink to="/dashboard" className="header-brand">
          <img src={logo} alt="Logo" className="header-logo" />
          <span className="header-title">Smart Lists</span>
        </NavLink>

        {/* --- ZONE CENTRE : Navigation Principale --- */}
        <nav className="header-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Accueil
          </NavLink>
          <NavLink to="/files" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Fichiers
          </NavLink>
          <NavLink to="/statistics" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Statistiques
  </NavLink>
        </nav>

        {/* --- ZONE DROITE : Menu Utilisateur --- */}
        <div className="header-user-menu" ref={dropdownRef}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="user-menu-button">
            <FaUserCircle className="user-icon" />
            <span>{user.username}</span>
          </button>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              {user.role === 'admin' && (
                <NavLink to="/admin" className="dropdown-item">
                  <FaCog /> Espace Admin
                </NavLink>
              )}
              <button onClick={handleLogout} className="dropdown-item logout">
                <FaSignOutAlt /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;