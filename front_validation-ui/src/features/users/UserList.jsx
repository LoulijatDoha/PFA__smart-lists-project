// src/features/users/UserList.jsx
import React, { useState, useEffect } from 'react';
import { FaEdit, FaKey, FaUserSlash } from 'react-icons/fa';
import './UserList.css';

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

const UserList = ({ users, loading, searchTerm, setSearchTerm, onAction }) => {
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  useEffect(() => {
    setSelectedUserIds([]);
  }, [users, searchTerm]); // Se réinitialise si on change de page ou si on recherche

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectOne = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="user-list-container">
      <div className="list-controls">
        <input
          type="text"
          placeholder="Rechercher par nom, email..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {selectedUserIds.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedUserIds.length} sélectionné(s)</span>
          <div>
            <button
              className="bulk-action-button password"
              onClick={() => onAction('reset-password-selected', selectedUserIds)}
            >
              <FaKey /> Réinit. MDP
            </button>
            <button
              className="bulk-action-button danger"
              onClick={() => onAction('deactivate-selected', selectedUserIds)}
            >
              <FaUserSlash /> Désactiver
            </button>
          </div>
        </div>
      )}

      <table className="users-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={users.length > 0 && selectedUserIds.length === users.length}
                indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < users.length}
              />
            </th>
            <th>Nom Complet</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Dernière Connexion</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={selectedUserIds.includes(user.id) ? 'selected' : ''}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => handleSelectOne(user.id)}
                />
              </td>
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
                  <button className="action-button edit" title="Modifier" onClick={() => onAction('edit', user)}>
                    <FaEdit />
                  </button>
                  <button className="action-button password" title="Réinitialiser le mot de passe" onClick={() => onAction('reset-password', user)}>
                    <FaKey />
                  </button>
                  <button
                    className="action-button danger"
                    title="Désactiver"
                    onClick={() => onAction('deactivate', user)}
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