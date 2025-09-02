// src/components/shared/Header.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

// Importez votre logo depuis le dossier assets
import logo from '../../assets/LDE_Logo_GRP_RVB_VH.svg';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirige vers la page de login après déconnexion
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
    }
  };

  // Si aucun utilisateur n'est connecté, le composant ne rend rien.
  // C'est le Layout qui décide de l'afficher ou non, mais c'est une sécurité supplémentaire.
  if (!user) {
    return null;
  }

  return (
    <header className="app-header">
      <div className="header-content">
        
        {/* --- ZONE 1 : Identité --- */}
        <NavLink to="/dashboard" className="header-brand">
          <img src={logo} alt="Logo" className="header-logo" />
          <span className="header-title">Smart Lists</span>
        </NavLink>

        {/* --- ZONE 2 : Navigation --- */}
        <nav className="header-nav">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Tableau de Bord
          </NavLink>
          
          {/* Affiche ce lien uniquement si l'utilisateur est un admin */}
          {user.role === 'admin' && (
            <NavLink 
              to="/admin/users" 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Administration
            </NavLink>
          )}
        </nav>

        {/* --- ZONE 3 : Utilisateur --- */}
        <div className="header-user">
          <span className="user-name">Bonjour, {user.username}</span>
          <button onClick={handleLogout} className="logout-button">
            Déconnexion
          </button>
        </div>
        
      </div>
    </header>
  );
};

export default Header;