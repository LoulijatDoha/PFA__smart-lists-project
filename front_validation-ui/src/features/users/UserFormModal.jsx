// src/features/users/UserFormModal.jsx
import React, { useState, useEffect } from 'react';
import { createUser, updateUser } from '../../services/userService';
import './UserFormModal.css'; // On va ajouter un peu de style

const UserFormModal = ({ isOpen, userToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'validator',
    is_active: true
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!userToEdit;

  // useEffect se déclenche quand on ouvre la modale pour éditer un utilisateur
  useEffect(() => {
    if (isEditing) {
      // On pré-remplit le formulaire avec les données de l'utilisateur
      setFormData({
        username: userToEdit.username,
        password: '', // Le mot de passe n'est jamais affiché
        role: userToEdit.role,
        is_active: userToEdit.is_active,
      });
    } else {
      // On réinitialise le formulaire pour un nouvel utilisateur
      setFormData({ username: '', password: '', role: 'validator', is_active: true });
    }
  }, [userToEdit, isOpen]); // Dépendances: se relance si userToEdit ou isOpen change

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        // En mode édition, on ne transmet que les champs qui ont potentiellement changé.
        const dataToUpdate = {
          username: formData.username,
          role: formData.role,
          is_active: formData.is_active
        };
        // On n'ajoute le mot de passe que s'il a été saisi
        if (formData.password) {
          dataToUpdate.password = formData.password;
        }
        await updateUser(userToEdit.id, dataToUpdate);
      } else {
        // En mode création, tous les champs sont requis
        await createUser({
          username: formData.username,
          password: formData.password,
          role: formData.role
        });
      }
      onSave(); // Informe le parent que la sauvegarde a réussi
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditing ? `Modifier l'utilisateur` : 'Ajouter un utilisateur'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditing ? 'Laisser vide pour ne pas changer' : ''} required={!isEditing} />
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
              <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} />
              <label htmlFor="is_active">Compte actif</label>
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