// src/features/users/UserList.jsx
import React from 'react';
import { deactivateUser } from '../../services/userService'; // Chemin d'import corrigé

const UserList = ({ users, loading, onEdit, onDeleteSuccess }) => {
  
  const handleDelete = async (userId, username) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur "${username}" ?`)) {
      try {
        await deactivateUser(userId);
        alert("Utilisateur désactivé avec succès.");
        onDeleteSuccess(); // Informe le parent (UserAdminPage) de recharger la liste
      } catch (error) {
        alert("Erreur lors de la désactivation de l'utilisateur.");
        console.error(error);
      }
    }
  };

  if (loading) {
    return <p>Chargement des utilisateurs...</p>;
  }

  return (
    <table border="1" style={{ width: '100%', marginTop: '2rem' }}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom d'utilisateur</th>
          <th>Rôle</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.username}</td>
            <td>{user.role}</td>
            <td>{user.is_active ? 'Actif' : 'Désactivé'}</td>
            <td>
              <button onClick={() => onEdit(user)}>Modifier</button>
              <button 
                onClick={() => handleDelete(user.id, user.username)}
                disabled={!user.is_active}
                style={{ marginLeft: '0.5rem', backgroundColor: '#dc3545', color: 'white' }}
              >
                Désactiver
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserList;