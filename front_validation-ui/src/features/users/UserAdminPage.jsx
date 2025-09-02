// src/pages/UserAdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers } from '../../services/userService';

// On importera les composants de la page plus tard
import UserList from './UserList';
import UserFormModal from './UserFormModal';

const UserAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États pour la modale (le formulaire pop-up)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Si on modifie un utilisateur, on stocke ses infos ici

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAllUsers();
      setUsers(response.data);
    } catch (err) {
      setError("Impossible de charger la liste des utilisateurs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = () => {
    setEditingUser(null); // On s'assure qu'on n'est pas en mode édition
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };
  
  const handleSaveUser = () => {
    // Après avoir ajouté/modifié un utilisateur avec succès,
    // on ferme la modale et on recharge la liste.
    handleCloseModal();
    fetchUsers();
  };

  return (
    <div className="user-admin-page">
      <div className="page-header">
        <h1>Gestion des Utilisateurs</h1>
        <button onClick={handleAddUser}>+ Ajouter un Utilisateur</button>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <UserList 
        users={users} 
        loading={loading}
        onEdit={handleEditUser}
        onDeleteSuccess={fetchUsers} // On recharge la liste après une suppression
      />
      
      <UserFormModal 
        isOpen={isModalOpen}
        userToEdit={editingUser}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default UserAdminPage;