// src/components/shared/Footer.jsx
import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <span>© {currentYear} Smart Lists. Tous droits réservés.</span>
        <span className="footer-separator">|</span>
        <a href="mailto:support@votreentreprise.com">Support Technique</a>
      </div>
    </footer>
  );
};

export default Footer;