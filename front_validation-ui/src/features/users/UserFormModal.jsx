// src/features/users/UserFormModal.jsx
import React, { useState, useEffect } from 'react';
import { createUser, updateUser } from '../../services/userService';
import './UserFormModal.css';

const UserFormModal = ({ isOpen, userToEdit, onClose, onSave }) => {
  const initialState = {
    username: '', password: '', role: 'validator', is_active: true,
    nom_complet: '', email: '', poste: ''
  };
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditing = !!userToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({
          username: userToEdit.username, password: '', role: userToEdit.role, is_active: userToEdit.is_active,
          nom_complet: userToEdit.nom_complet || '', email: userToEdit.email || '', poste: userToEdit.poste || ''
        });
      } else {
        setFormData(initialState);
      }
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
        const { password, ...dataToUpdate } = formData; // Exclure le mot de passe
        await updateUser(userToEdit.id, dataToUpdate);
      } else {
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
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditing ? `Modifier l'utilisateur` : 'Ajouter un utilisateur'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom Complet</label>
            <input type="text" name="nom_complet" value={formData.nom_complet} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
           <div className="form-group">
            <label>Poste</label>
            <input type="text" name="poste" value={formData.poste} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} 
                   placeholder={isEditing ? 'Ignoré en modification' : ''} 
                   required={!isEditing}
                   disabled={isEditing} />
            {isEditing && <small>Utilisez le bouton "Réinitialiser" dans la liste pour changer le mot de passe.</small>}
          </div>
          <div className="form-group">
            <label>Rôle</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="validator">Validateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          {isEditing && (
            <div className="form-group-checkbox">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
              <label>Compte actif</label>
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" disabled={loading}>{loading ? 'Sauvegarde...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;