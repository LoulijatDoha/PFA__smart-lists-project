// src/components/layout/MainLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';

// --- CES CHEMINS SONT À CORRIGER ---
// ANCIEN CHEMIN: import Header from '../shared/Header';
// ANCIEN CHEMIN: import Footer from '../shared/Footer';

// --- NOUVEAUX CHEMINS CORRECTS ---
// Puisque Header.jsx est dans le MÊME dossier que MainLayout.jsx, le chemin est beaucoup plus simple.
import Header from './Header';
import Footer from './Footer';

import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-content">
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;