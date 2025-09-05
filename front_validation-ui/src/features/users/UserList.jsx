// src/features/users/UserList.jsx
import React from 'react';
import { deactivateUser, resetPassword } from '../../services/userService';
import toast from 'react-hot-toast';
import { FaEdit, FaKey, FaUserSlash } from 'react-icons/fa'; // Import des icônes
import './UserList.css';

// Petit composant pour créer les avatars avec les initiales
const Avatar = ({ name }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  return <div className="avatar">{getInitials(name)}</div>;
};

const UserList = ({ users, loading, searchTerm, setSearchTerm, onEdit, onDeleteSuccess }) => {
  
  const handleDeactivate = async (userId, username) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur "${username}" ?`)) {
      try {
        await deactivateUser(userId);
        toast.success("Utilisateur désactivé avec succès.");
        onDeleteSuccess();
      } catch (error) {
        toast.error("Erreur lors de la désactivation.");
      }
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt("Veuillez entrer un nouveau mot de passe temporaire pour cet utilisateur :");
    if (newPassword && newPassword.length >= 8) {
      try {
        await resetPassword(userId, newPassword);
        toast.success("Le mot de passe a été réinitialisé avec succès.");
      } catch (error) {
        toast.error("Erreur lors de la réinitialisation du mot de passe.");
      }
    } else if (newPassword) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
    }
  };

  if (loading) return <p>Chargement des utilisateurs...</p>;

  return (
    <div className="user-list-container">
      <div className="list-controls">
        <span>Afficher <strong>{users.length}</strong> entrées</span>
        <input
          type="text"
          placeholder="Rechercher..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>Nom Complet</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Dernière Connexion</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="user-info">
                  <Avatar name={user.nom_complet} />
                  <div>
                    <div className="user-name">{user.nom_complet}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
              </td>
              <td>{user.role}</td>
              <td>
                <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Actif' : 'Désactivé'}
                </span>
              </td>
              <td>{user.last_login || 'Jamais'}</td>
              <td>
                <div className="actions-cell">
                  <button className="action-button edit" title="Modifier" onClick={() => onEdit(user)}>
                    <FaEdit />
                  </button>
                  <button className="action-button password" title="Réinitialiser le mot de passe" onClick={() => handleResetPassword(user.id)}>
                    <FaKey />
                  </button>
                  <button 
                    className="action-button danger"
                    title="Désactiver"
                    onClick={() => handleDeactivate(user.id, user.username)}
                    disabled={!user.is_active}
                  >
                    <FaUserSlash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;