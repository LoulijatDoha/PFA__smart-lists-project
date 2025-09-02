// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Assurez-vous que l'extension est correcte (.jsx ou .js)
import { AuthProvider } from './context/AuthContext.jsx'; // Utilisez .jsx si c'est le cas
import { BrowserRouter } from 'react-router-dom';
import './index.css'; // Si vous avez un fichier de styles globaux
import { pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';


pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1. Le Routeur doit englober le Contexte et l'App */}
    <BrowserRouter>
      {/* 2. Le Contexte d'Authentification doit englober l'App */}
      <AuthProvider>
        {/* 3. L'Application principale */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);