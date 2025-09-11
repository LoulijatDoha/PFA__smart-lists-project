// src/features/standardisation/StandardisationFormModal.jsx
import React, { useState, useEffect } from 'react';
import { createStandardisationEntry, updateStandardisationEntry } from '../../services/standardisationService';
import '../users/UserFormModal.css'; // Réutilise le style du modal utilisateur qui est générique

const STATUT_OPTIONS = ['VALIDÉ', 'AUTO_APPROUVÉ', 'À_VÉRIFIER'];

const StandardisationFormModal = ({ isOpen, stdType, entryToEdit, onClose, onSave }) => {
  const getInitialState = () => ({
    valeur_brute: '',
    nom_standardise: '',
    statut: 'À_VÉRIFIER',
    score_confiance: ''
  });

  const [formData, setFormData] = useState(getInitialState());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditing = !!entryToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && entryToEdit) {
        setFormData({
          valeur_brute: entryToEdit.valeur_brute || '',
          nom_standardise: entryToEdit.nom_standardise || '',
          statut: entryToEdit.statut || 'À_VÉRIFIER',
          score_confiance: entryToEdit.score_confiance ?? ''
        });
      } else {
        setFormData(getInitialState());
      }
      setError(''); // Clear error on open
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

    const score = formData.score_confiance ? parseFloat(formData.score_confiance) : null;
    if (score !== null && (score < 0 || score > 1)) {
        setError("Le score de confiance doit être compris entre 0 et 1.");
        setLoading(false);
        return;
    }

    const dataPayload = { ...formData, score_confiance: score };
    
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2>{isEditing ? `Modifier la Règle #${entryToEdit.id}` : 'Ajouter une Règle'}</h2>
        </div>

        <div className="modal-body">
          <form id="std-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="valeur_brute">Valeur Brute</label>
              <input id="valeur_brute" type="text" name="valeur_brute" value={formData.valeur_brute} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="nom_standardise">Nom Standardisé</label>
              <input id="nom_standardise" type="text" name="nom_standardise" value={formData.nom_standardise} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="statut">Statut</label>
              <select id="statut" name="statut" value={formData.statut} onChange={handleChange}>
                {STATUT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="score_confiance">Score de Confiance (0.00 - 1.00)</label>
              <input id="score_confiance" type="number" step="0.01" min="0" max="1" name="score_confiance" value={formData.score_confiance} onChange={handleChange} placeholder="Ex: 0.95" />
            </div>
          </form>
        </div>

        <div className="modal-footer">
          {error && <p className="error-message-inline">{error}</p>}
          <div className="form-actions">
            <button type="button" className="button-secondary" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" form="std-form" disabled={loading}>{loading ? 'Sauvegarde...' : 'Enregistrer'}</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StandardisationFormModal;