// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>404</h1>
      <h2>Page non trouvée</h2>
      <p>Désolé, la page que vous cherchez n'existe pas.</p>
      <Link to="/dashboard">Retourner au Tableau de Bord</Link>
    </div>
  );
};

export default NotFoundPage;