// src/features/users/UserAdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers, deactivateUser, resetPassword, bulkDeactivateUsers, bulkResetPassword } from '../../services/userService';
import UserList from './UserList';
import UserFormModal from './UserFormModal';
import Pagination from '../../components/shared/Pagination';
import toast from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa';
import './UserAdminPage.css';

const ITEMS_PER_PAGE = 10;

const UserAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async (page) => {
    setLoading(true);
    try {
      const response = await getAllUsers(page, ITEMS_PER_PAGE);
      setUsers(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotalUsers(response.data.total_items);
    } catch (err) {
      toast.error("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };
  
  const handleSaveUser = () => {
    handleCloseModal();
    fetchUsers(currentPage);
    toast.success("Utilisateur enregistré !");
  };

  const handleAction = async (actionType, payload) => {
    switch (actionType) {
      case 'edit':
        setEditingUser(payload);
        setIsModalOpen(true);
        break;

      case 'add':
        setEditingUser(null);
        setIsModalOpen(true);
        break;

      case 'reset-password':
        const newPassword = prompt(`Nouveau mot de passe temporaire pour ${payload.username}:`);
        if (newPassword && newPassword.length >= 8) {
          try {
            await resetPassword(payload.id, newPassword);
            toast.success("Mot de passe réinitialisé.");
          } catch (error) { toast.error("Erreur de réinitialisation."); }
        } else if (newPassword) { toast.error("Le mot de passe doit faire au moins 8 caractères."); }
        break;

      case 'deactivate':
        if (window.confirm(`Désactiver l'utilisateur "${payload.username}" ?`)) {
          try {
            await deactivateUser(payload.id);
            toast.success("Utilisateur désactivé.");
            fetchUsers(currentPage);
          } catch (error) { toast.error("Erreur de désactivation."); }
        }
        break;

      case 'deactivate-selected':
        if (window.confirm(`Désactiver les ${payload.length} utilisateurs sélectionnés ?`)) {
          try {
            await bulkDeactivateUsers(payload);
            toast.success("Utilisateurs sélectionnés désactivés.");
            fetchUsers(currentPage);
          } catch (error) { toast.error("Erreur de désactivation groupée."); }
        }
        break;

      case 'reset-password-selected':
        const newBulkPassword = prompt(`Entrez un nouveau mot de passe temporaire pour les ${payload.length} utilisateurs sélectionnés :`);
        if (newBulkPassword && newBulkPassword.length >= 8) {
            try {
                await bulkResetPassword(payload, newBulkPassword);
                toast.success("Mots de passe réinitialisés.");
                fetchUsers(currentPage);
            } catch (error) { toast.error("Erreur de réinitialisation groupée."); }
        } else if (newBulkPassword) { toast.error("Le mot de passe doit faire au moins 8 caractères."); }
        break;
      
      default:
        break;
    }
  };

  const filteredUsers = users.filter(user =>
    (user.nom_complet?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-content-page">
      <div className="page-header">
        <h1>Gestion des Utilisateurs</h1>
        <button className="add-button" onClick={() => handleAction('add')}>
          <FaPlus style={{ marginRight: '8px' }} /> Ajouter un Utilisateur
        </button>
      </div>

      <div className="stat-card-container">
        <div className="stat-card"><h3>{totalUsers}</h3><p>Utilisateurs au Total</p></div>
        <div className="stat-card"><h3>{users.filter(u => u.is_active).length}</h3><p>Comptes Actifs (sur cette page)</p></div>
      </div>
      
      <UserList 
        users={filteredUsers} 
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAction={handleAction}
      />
      
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
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