// src/pages/LoginPage.jsx - VERSION CORRIGÉE ET UNIFIÉE

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Les styles sont maintenant importés directement ici
import './LoginPage.css'; 

// On importe les icônes
import { FiEye, FiEyeOff } from 'react-icons/fi'; 

// On importe les assets
import logo from '../../assets/LDE_Logo_GRP_RVB_VH.svg';
import login_image from '../../assets/books.png';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  
  // NOUVEL ÉTAT pour gérer le statut de la connexion
  const [loginStatus, setLoginStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Logique de page (titre du document)
  useEffect(() => {
    document.title = "Connexion - Portail de Validation";
  }, []);

  // Animation d'entrée
  useEffect(() => {
    const formSection = document.querySelector('.login-form-section');
    const imageSection = document.querySelector('.login-image-section');
    
    if (formSection && imageSection) {
      formSection.style.opacity = '0';
      formSection.style.transform = 'translateX(20px)';
      imageSection.style.opacity = '0';
      imageSection.style.transform = 'translateX(-20px)';
      
      setTimeout(() => {
        formSection.style.transition = 'all 0.8s ease';
        imageSection.style.transition = 'all 0.8s ease';
        formSection.style.opacity = '1';
        formSection.style.transform = 'translateX(0)';
        imageSection.style.opacity = '1';
        imageSection.style.transform = 'translateX(0)';
      }, 100);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.username.trim()) {
      setError('Le nom d\'utilisateur est requis');
      return;
    }
    if (!formData.password) {
      setError('Le mot de passe est requis');
      return;
    }

    setLoginStatus('loading');

    try {
      await login(formData.username, formData.password);
      setLoginStatus('success'); // On passe le statut à "succès"
      
      // On attend 1 seconde pour que l'utilisateur voie le message de succès, PUIS on navigue
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion. Veuillez vérifier vos identifiants.');
      setLoginStatus('idle'); // On remet le bouton à son état initial en cas d'erreur
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && loginStatus !== 'loading') {
      handleLogin(e);
    }
  };

  // Détermine si les champs ou le bouton doivent être désactivés
  const isLoading = loginStatus === 'loading' || loginStatus === 'success';

  return (
    <div className="login-page-container">
      {/* --- SECTION IMAGE (GAUCHE) --- */}
      <div className="login-image-section">
        <img src={login_image} alt="Bibliothèque de livres" className="login-image" loading="eager"/>
        <div className="login-image-overlay">
          <h2>Smart Lists</h2>
          <p>Plateforme de Validation Intelligente des Fournitures Scolaires</p>
        </div>
      </div>
             
      {/* --- SECTION FORMULAIRE (DROITE) --- */}
      <div className="login-form-section">
        <div className="login-form-content">
          <img src={logo} alt="Logo Smart Lists" className="login-logo" loading="eager"/>
          <h2>Portail de Connexion</h2>
          <p className="subtitle">Accès sécurisé pour les employés autorisés</p>

          <form onSubmit={handleLogin} noValidate>
            <div className="input-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                autoComplete="username"
                placeholder="Entrez votre nom d'utilisateur"
                required
                disabled={isLoading}
                aria-describedby={error ? "error-message" : undefined}
              />
            </div>
            
            <div className="input-group password-input-group">
              <label htmlFor="password">Mot de passe</label>
              <div className="password-input-container">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  autoComplete="current-password"
                  placeholder="Entrez votre mot de passe"
                  required
                  disabled={isLoading}
                  aria-describedby={error ? "error-message" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  disabled={isLoading}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
                       
            {error && (
              <div id="error-message" className="error-message" role="alert" aria-live="polite">
                {error}
              </div>
            )}
            
            {/* CORRECTION : Le contenu du bouton est maintenant piloté par l'état `loginStatus` */}
            <button 
              type="submit" 
              className={`login-button ${loginStatus === 'success' ? 'success' : ''}`} 
              disabled={isLoading}
            >
              {loginStatus === 'loading' && (
                <>
                  <span className="loading-spinner"></span>
                  Vérification...
                </>
              )}
              {loginStatus === 'success' && '✓ Connexion réussie'}
              {loginStatus === 'idle' && 'Se Connecter'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Besoin d'aide ? <a href="mailto:support@smartlists.ma">Contacter le support</a>
            </p>
            <p className="copyright-text">
              © {new Date().getFullYear()} Smart Lists - Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;