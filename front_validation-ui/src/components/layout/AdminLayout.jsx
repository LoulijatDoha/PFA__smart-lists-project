// src/components/layout/AdminLayout.jsx
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Header from './Header'; // On réutilise le header principal
import Footer from './Footer'; // On réutilise le footer principal
import './AdminLayout.css'; // On importe le style dédié

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Header />
      <div className="admin-container">
        {/* Barre de navigation latérale pour la section admin */}
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <NavLink 
              to="/admin/users" 
              className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
            >
              Gestion des Utilisateurs
            </NavLink>
            <NavLink 
              to="/admin/standardisation" 
              className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
            >
              Gestion Standardisation
            </NavLink>
            {/* 
              Vous pourrez facilement ajouter d'autres liens d'administration ici à l'avenir.
              Par exemple :
              <NavLink to="/admin/logs" className={...}>
                Logs Système
              </NavLink> 
            */}
          </nav>
        </aside>

        {/* Le contenu de la page admin (UserAdminPage ou StandardisationAdminPage) s'affichera ici */}
        <main className="admin-content">
          <Outlet /> 
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLayout;