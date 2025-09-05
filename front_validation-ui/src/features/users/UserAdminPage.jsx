// src/features/users/UserAdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers } from '../../services/userService';
import UserList from './UserList';
import UserFormModal from './UserFormModal';
import Pagination from '../../components/shared/Pagination'; // Importer le composant
import toast from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa';
import './UserAdminPage.css';

const ITEMS_PER_PAGE = 10; // Vous pouvez ajuster cette valeur

const UserAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- États pour la pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async (pageToFetch) => {
    setLoading(true);
    try {
      const response = await getAllUsers(pageToFetch, ITEMS_PER_PAGE);
      setUsers(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotalUsers(response.data.total_items);
    } catch (err) {
      toast.error("Impossible de charger la liste des utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, []); // Ce hook ne dépend de rien, car la page est passée en argument

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]); // Se redéclenche quand la page change

  const handleAddUser = () => {
    setEditingUser(null);
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
    handleCloseModal();
    // On recharge la page actuelle pour voir les changements
    fetchUsers(currentPage);
    toast.success("Utilisateur enregistré avec succès !");
  };

  // Le filtrage par recherche se fait maintenant sur la page de données actuelle.
  // Pour une recherche sur TOUTES les données, il faudrait l'implémenter côté backend.
  const filteredUsers = users.filter(user =>
    (user.nom_complet?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const activeUsersCount = users.filter(u => u.is_active).length;

  return (
    <div className="admin-content-page">
      <div className="page-header">
        <h1>Gestion des Utilisateurs</h1>
        <button className="add-button" onClick={handleAddUser}>
          <FaPlus style={{ marginRight: '8px' }} /> Ajouter un Utilisateur
        </button>
      </div>

      <div className="stat-card-container">
        <div className="stat-card">
          <h3>{totalUsers}</h3>
          <p>Utilisateurs au Total</p>
        </div>
        <div className="stat-card">
          <h3>{activeUsersCount}</h3>
          <p>Comptes Actifs (sur cette page)</p>
        </div>
      </div>
      
      <UserList 
        users={filteredUsers} 
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onEdit={handleEditUser}
        onDeleteSuccess={() => fetchUsers(currentPage)}
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