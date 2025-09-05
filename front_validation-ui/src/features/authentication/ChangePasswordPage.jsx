// src/features/authentication/ChangePasswordPage.jsx
import { React, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeMyPassword } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// On importe le nouveau style dédié
import './ChangePasswordPage.css'; 

// On peut utiliser la même image ou une autre pour la cohérence visuelle
import resetImage from '../../assets/books.png'; 

const ChangePasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 8) {
            setError("Le mot de passe doit faire au moins 8 caractères.");
            return;
        }
        if (password !== confirm) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        setLoading(true);
        try {
            await changeMyPassword(password);
            refreshUser();
            toast.success("Mot de passe changé avec succès !");
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-page-container">
            {/* --- SECTION FORMULAIRE (GAUCHE) --- */}
            <div className="reset-form-section">
                <div className="reset-form-content">
                    <h1>Réinitialisation de votre mot de passe</h1>
                    <div className="title-divider"></div>
                    <p className="subtitle">
                        Pour des raisons de sécurité, veuillez définir un nouveau mot de passe.
                    </p>
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="input-group">
                            <label htmlFor="password">Nouveau mot de passe (8 caractères minimum)</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="confirm">Confirmer le nouveau mot de passe</label>
                            <input
                                id="confirm"
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
                        </button>
                    </form>
                </div>
            </div>
            
            {/* --- SECTION IMAGE (DROITE) --- */}
            <div className="reset-image-section">
                 <img src={resetImage} alt="Illustration de sécurité" />
                 <div className="image-overlay">
                    <h2>Sécurité Avant Tout</h2>
                    <p>Votre nouveau mot de passe assure la protection de votre compte.</p>
                 </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;