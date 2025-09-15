// src/components/layout/MainLayout.jsx

import React from 'react';
//  Importer le hook 'useLocation' pour connaître l'URL actuelle ---
import { Outlet, useLocation } from 'react-router-dom'; 

import Header from './Header';
import Footer from './Footer';
import './MainLayout.css';

const MainLayout = () => {
  // Obtenir les informations sur la route actuelle ---
  const location = useLocation();

  // Déterminer si nous sommes sur une page de validation ---
  // Si l'URL commence par "/validate", c'est une page de validation.
  const isValidationPage = location.pathname.startsWith('/validate');

  //  Définir la classe CSS à appliquer au conteneur principal ---
  // Si c'est la page de validation, on ajoute 'no-background'. Sinon, 'with-background'.
  const layoutClassName = isValidationPage ? 'main-layout no-background' : 'main-layout with-background';

  return (
    // Appliquer la classe dynamique ---
    <div className={layoutClassName}>
      <Header />
      <main className="main-content">
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;