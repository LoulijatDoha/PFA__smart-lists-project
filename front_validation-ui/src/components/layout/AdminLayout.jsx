// src/components/layout/AdminLayout.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { FaUsers, FaCogs, FaChevronLeft, FaBars } from 'react-icons/fa';
import './AdminLayout.css';

// Constantes pour les dimensions
const SIDEBAR_COLLAPSED_WIDTH = 80; // Largeur en mode icônes seules
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 500;

const AdminLayout = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Pour le menu mobile
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const sidebarRef = useRef(null);
  const lastWidthRef = useRef(sidebarWidth);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Logique de redimensionnement pour ordinateur
  const startResizing = useCallback((e) => { e.preventDefault(); setIsResizing(true); }, []);
  const stopResizing = useCallback(() => { setIsResizing(false); }, []);

  const resize = useCallback((e) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      if (newWidth >= SIDEBAR_MIN_WIDTH && newWidth <= SIDEBAR_MAX_WIDTH) {
        setSidebarWidth(newWidth);
        lastWidthRef.current = newWidth;
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Gère le clic sur le bouton principal
  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      const isCurrentlyCollapsed = sidebarWidth === SIDEBAR_COLLAPSED_WIDTH;
      if (isCurrentlyCollapsed) {
        setSidebarWidth(lastWidthRef.current); // Restaurer la dernière largeur
      } else {
        lastWidthRef.current = sidebarWidth; // Sauvegarder la largeur actuelle
        setSidebarWidth(SIDEBAR_COLLAPSED_WIDTH); // Réduire
      }
    }
  };

  const isCollapsed = !isMobile && sidebarWidth === SIDEBAR_COLLAPSED_WIDTH;

  return (
    <div className={`admin-layout ${isResizing ? 'is-resizing' : ''}`}>
      <Header />
      <div className="admin-container">
        {isMobile && isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
        
        <aside
          ref={sidebarRef}
          className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile && isSidebarOpen ? 'open' : ''}`}
          style={{ flexBasis: isMobile ? undefined : `${sidebarWidth}px` }}
        >
          {/* CORRIGÉ: Le bouton est maintenant à côté du titre */}
          <div className="sidebar-header">
            <h2 className="sidebar-title">Administration</h2>
            <button onClick={toggleSidebar} className="sidebar-toggle" title={isCollapsed ? "Agrandir" : "Réduire"}>
              {isMobile ? <FaBars/> : <FaChevronLeft style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }} />}
            </button>
          </div>
          
          <nav className="admin-nav">
            <NavLink to="/admin/users" className="admin-nav-link" onClick={() => isMobile && setIsSidebarOpen(false)}>
              <FaUsers className="nav-icon" />
              <span className="nav-text">Utilisateurs</span>
            </NavLink>
            <NavLink to="/admin/standardisation" className="admin-nav-link" onClick={() => isMobile && setIsSidebarOpen(false)}>
              <FaCogs className="nav-icon" />
              <span className="nav-text">Standardisation</span>
            </NavLink>
          </nav>
          
          {!isMobile && !isCollapsed && (
            <div className="sidebar-resizer" onMouseDown={startResizing} />
          )}
        </aside>

        <main className="admin-content">
          <div className="admin-page"><Outlet /></div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLayout;