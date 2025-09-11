// src/features/users/UserList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaEdit, FaKey, FaUserSlash } from 'react-icons/fa';
import './UserList.css';

// Hook personnalisé pour le "debounce"
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const Avatar = ({ name }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    return (names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`
      : name.substring(0, 2)
    ).toUpperCase();
  };
  return <div className="avatar">{getInitials(name)}</div>;
};

const UserList = ({ users, loading, onAction, onSearch }) => {
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const debouncedSearchTerm = useDebounce(inputValue, 300); // Délai de 300ms
  const checkboxRef = useRef();

  // Mettre à jour la recherche dans le composant parent
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  // Vider la sélection si la liste change
  useEffect(() => {
    setSelectedUserIds([]);
  }, [users]);

  // Gérer la checkbox "indeterminate"
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = selectedUserIds.length > 0 && selectedUserIds.length < users.length;
    }
  }, [selectedUserIds, users]);

  const handleSelectAll = (e) => {
    setSelectedUserIds(e.target.checked ? users.map(user => user.id) : []);
  };

  const handleSelectOne = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</p>;

  return (
    <div className="user-list-container">
      <div className="list-controls">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          className="search-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      {selectedUserIds.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedUserIds.length} sélectionné(s)</span>
          <div>
            <button className="bulk-action-button password" onClick={() => onAction('reset-password-selected', selectedUserIds)}><FaKey /> Réinit. MDP</button>
            <button className="bulk-action-button danger" onClick={() => onAction('deactivate-selected', selectedUserIds)}><FaUserSlash /> Désactiver</button>
          </div>
        </div>
      )}

      <table className="users-table">
        <thead>
          <tr>
            <th><input type="checkbox" ref={checkboxRef} onChange={handleSelectAll} checked={users.length > 0 && selectedUserIds.length === users.length}/></th>
            <th>Utilisateur</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Dernière Connexion</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className={selectedUserIds.includes(user.id) ? 'selected' : ''}>
                <td><input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => handleSelectOne(user.id)}/></td>
                <td>
                  <div className="user-info">
                    <Avatar name={user.nom_complet} />
                    <div>
                      <div className="user-name">{user.nom_complet || '(Non défini)'}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>{user.role}</td>
                <td><span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>{user.is_active ? 'Actif' : 'Désactivé'}</span></td>
                <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Jamais'}</td>
                <td>
                  <div className="actions-cell">
                    <button className="action-button" title="Modifier" onClick={() => onAction('edit', user)}><FaEdit className="edit-icon" /></button>
                    <button className="action-button" title="Réinitialiser le mot de passe" onClick={() => onAction('reset-password', user)}><FaKey className="password-icon" /></button>
                    <button className="action-button" title="Désactiver" onClick={() => onAction('deactivate', user)} disabled={!user.is_active}><FaUserSlash className="danger-icon" /></button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr className="empty-row"><td colSpan="6">Aucun utilisateur ne correspond à votre recherche.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;