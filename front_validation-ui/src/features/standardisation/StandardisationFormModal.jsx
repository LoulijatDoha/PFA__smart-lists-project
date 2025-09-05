// src/features/standardisation/StandardisationFormModal.jsx
import React, { useState, useEffect } from 'react';
import { createStandardisationEntry, updateStandardisationEntry } from '../../services/standardisationService';
import '../users/UserFormModal.css'; // On réutilise le même style que pour les utilisateurs

const STATUT_OPTIONS = ['VALIDÉ', 'AUTO_APPROUVÉ', 'À_VÉRIFIER'];

const StandardisationFormModal = ({ isOpen, stdType, entryToEdit, onClose, onSave }) => {
  const initialState = {
    valeur_brute: '',
    nom_standardise: '',
    statut: 'À_VÉRIFIER',
    score_confiance: ''
  };
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!entryToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({
          valeur_brute: entryToEdit.valeur_brute || '',
          nom_standardise: entryToEdit.nom_standardise || '',
          statut: entryToEdit.statut || 'À_VÉRIFIER',
          score_confiance: entryToEdit.score_confiance || ''
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [entryToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const dataPayload = {
        ...formData,
        score_confiance: formData.score_confiance ? parseFloat(formData.score_confiance) : null
    };

    try {
      if (isEditing) {
        await updateStandardisationEntry(stdType, entryToEdit.id, dataPayload);
      } else {
        await createStandardisationEntry(stdType, dataPayload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditing ? `Modifier une Règle` : 'Ajouter une Règle'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Valeur Brute</label>
            <input type="text" name="valeur_brute" value={formData.valeur_brute} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Nom Standardisé</label>
            <input type="text" name="nom_standardise" value={formData.nom_standardise} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Statut</label>
            <select name="statut" value={formData.statut} onChange={handleChange}>
              {STATUT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Score de Confiance (optionnel)</label>
            <input type="number" step="0.01" min="0" max="1" name="score_confiance" value={formData.score_confiance} onChange={handleChange} />
          </div>
          
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

export default StandardisationFormModal;