// src/features/users/UserFormModal.jsx
import React, { useState, useEffect } from 'react';
import { createUser, updateUser } from '../../services/userService';
import './UserFormModal.css';

const UserFormModal = ({ isOpen, userToEdit, onClose, onSave }) => {
  const getInitialState = () => ({
    username: '', password: '', role: 'validator', is_active: true,
    nom_complet: '', email: '', poste: ''
  });

  const [formData, setFormData] = useState(getInitialState());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditing = !!userToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && userToEdit) {
        setFormData({
          username: userToEdit.username,
          password: '',
          role: userToEdit.role,
          is_active: userToEdit.is_active,
          nom_complet: userToEdit.nom_complet || '',
          email: userToEdit.email || '',
          poste: userToEdit.poste || ''
        });
      } else {
        setFormData(getInitialState());
      }
      setError(''); // Vider les erreurs à chaque ouverture
    }
  }, [userToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        // Exclure le mot de passe s'il est vide, sinon l'API pourrait le mettre à jour
        const { password, ...dataToUpdate } = formData;
        const payload = password ? dataToUpdate : { ...dataToUpdate, password: undefined };
        await updateUser(userToEdit.id, payload);
      } else {
        if (!formData.password || formData.password.length < 8) {
          setError("Le mot de passe est requis et doit faire au moins 8 caractères.");
          setLoading(false);
          return;
        }
        await createUser(formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2>{isEditing ? `Modifier : ${userToEdit.username}` : 'Ajouter un utilisateur'}</h2>
        </div>

        <div className="modal-body">
          <form id="user-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="nom_complet">Nom Complet</label>
              <input id="nom_complet" type="text" name="nom_complet" value={formData.nom_complet} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="poste">Poste</label>
              <input id="poste" type="text" name="poste" value={formData.poste} onChange={handleChange} />
            </div>
            <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '2rem 0'}} />
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input 
                id="password" type="password" name="password" value={formData.password} onChange={handleChange} 
                placeholder={isEditing ? 'Laisser vide pour ne pas changer' : ''} 
                required={!isEditing}
              />
              {isEditing && <small>Pour forcer un changement, utilisez le bouton "Réinitialiser" dans la liste.</small>}
            </div>
            <div className="form-group">
              <label htmlFor="role">Rôle</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange}>
                <option value="validator">Validateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            {isEditing && (
              <div className="form-group-checkbox">
                <input id="is_active" type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                <label htmlFor="is_active">Le compte est actif</label>
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
           {error && <p className="error-message-inline">{error}</p>}
           <div className="form-actions">
            <button type="button" className="button-secondary" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" form="user-form" disabled={loading}>{loading ? 'Sauvegarde...' : 'Enregistrer'}</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserFormModal;