// src/features/validation/components/ValidationForm.jsx

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// --- Services ---
import { validateEntity, updateEntity, deleteManuel } from '../../../services/entityService';
import { getAllNiveaux } from '../../../services/niveauService';
import { updateListNiveau, addManuelToList } from '../../../services/listService';

// --- Icônes ---
import { FaSave, FaCheckCircle, FaTrash, FaPlus } from 'react-icons/fa';

// --- Style ---
import './ValidationForm.css';

const ValidationForm = ({ listData, selectedManuelId, onManuelSelect, onHighlight, onClearHighlight, onDataReload }) => {
  // --- États ---
  const [formData, setFormData] = useState(listData);
  const [niveauxOptions, setNiveauxOptions] = useState([]);

  // --- Effets ---
  // Met à jour le formulaire quand la `listData` (l'onglet de niveau) change.
  // Charge les options de niveau une seule fois.
  useEffect(() => {
    setFormData(listData);
    if (niveauxOptions.length === 0) {
      getAllNiveaux().then(res => setNiveauxOptions(res.data));
    }
  }, [listData, niveauxOptions.length]);

  // Si pas de données, on n'affiche rien.
  if (!formData) return null;

  // --- Gestionnaires d'événements ---

  // Gère la modification des champs de formulaire (général ou dans le tableau)
  const handleInputChange = (e, index = null) => {
    const { name, value } = e.target;
    if (index === null) {
      // Cas pour les champs généraux (école, ville, etc.)
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      // Cas pour les champs dans le tableau des manuels
      setFormData(prev => ({
        ...prev,
        manuels: prev.manuels.map((m, i) => i === index ? { ...m, [name]: value } : m)
      }));
    }
  };

  // Sauvegarde les modifications d'une entité existante
  const handleSave = async (entityType, entityId, dataToSave) => {
    try {
      await updateEntity(entityType, entityId, dataToSave);
      toast.success('Modification enregistrée !');
      onDataReload(); // Recharge les données pour synchroniser avec la BDD
    } catch (error) {
      toast.error(`Erreur de sauvegarde : ${error.response?.data?.error || error.message}`);
    }
  };

  // Supprime un manuel existant
  const handleDeleteManuel = async (manuelId, manuelTitre) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le manuel "${manuelTitre}" ?\n\nCette action est irréversible.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await deleteManuel(manuelId);
      toast.success('Manuel supprimé avec succès !');
      onDataReload();
    } catch (error) {
      toast.error(`Erreur de suppression : ${error.message}`);
    }
  };
  
  // Valide une entité (change son statut à 'VALIDÉ')
  const handleValidate = async (entityType, entityId, entityName = '') => {
    if (!window.confirm(`Valider : ${entityType} "${entityName}" ?`)) return;

    try {
      await validateEntity(entityType, entityId);
      toast.success(`${entityType} validé !`);
      onDataReload();
    } catch (error) {
      if (error.response?.status === 409) {
        toast(`Cet élément est déjà validé.`, { icon: 'ℹ️' });
      } else {
        toast.error(`Erreur de validation: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  // Met à jour en cascade le niveau de la liste et de ses manuels
  const handleSaveNiveauCascade = async () => {
    if (!formData.id_liste || !formData.id_niveau) return;
    try {
      await updateListNiveau(formData.id_liste, formData.id_niveau);
      toast.success('Le niveau de la liste et de ses manuels a été mis à jour !');
      onDataReload();
    } catch (error) {
      toast.error(`Erreur de sauvegarde du niveau : ${error.response?.data?.error || error.message}`);
    }
  };
  
  // Ajoute une nouvelle ligne vide dans le tableau des manuels
  const handleAddManuelRow = () => {
    const newEmptyManuel = {
      id_manuel: `new-${Date.now()}`,
      titre: '',
      isbn: '',
      editeur: '',
      type: '',
      matiere: '',
      annee_edition: '',
      statut: 'À_VÉRIFIER', // Le statut par défaut correct
      isNew: true, // Drapeau interne pour la logique d'affichage
    };
    setFormData(currentData => ({
      ...currentData,
      manuels: [...currentData.manuels, newEmptyManuel]
    }));
  };

  // Enregistre un manuel qui vient d'être ajouté manuellement
  const handleSaveNewManuel = async (manuelData) => {
    const { id_manuel, isNew, statut, ...payload } = manuelData;
    
    if (!payload.titre || payload.titre.trim() === '') {
      toast.error("Le titre est obligatoire pour ajouter un manuel.");
      return;
    }

    try {
      await addManuelToList(formData.id_liste, payload);
      toast.success('Nouveau manuel ajouté avec succès !');
      onDataReload();
    } catch (error) {
      toast.error(`Erreur lors de l'ajout : ${error.response?.data?.error || error.message}`);
    }
  };

  // --- Rendu du composant ---
  return (
    <div className="validation-form-container">
      {/* Section 1: Informations Générales sur la liste */}
      <div className="form-section">
        <h3>Informations Générales</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>École (Statut: {formData.statut_ecole})</label>
            <div className="input-with-action">
              <input type="text" name="nom_ecole" value={formData.nom_ecole || ''} onChange={(e) => handleInputChange(e)} onFocus={() => onHighlight('ecole', formData.id_ecole)} onBlur={onClearHighlight} />
              <button onClick={() => handleSave('ecoles', formData.id_ecole, { nom_ecole: formData.nom_ecole, ville: formData.ville })}><FaSave /></button>
              <button onClick={() => handleValidate('ecoles', formData.id_ecole, formData.nom_ecole)}><FaCheckCircle /></button>
            </div>
          </div>
          <div className="form-group">
            <label>Ville</label>
            <input type="text" name="ville" value={formData.ville || ''} onChange={(e) => handleInputChange(e)} onFocus={() => onHighlight('ecole', formData.id_ecole)} onBlur={onClearHighlight} />
          </div>
          <div className="form-group">
            <label>Année Scolaire (Statut: {formData.statut_annee})</label>
            <div className="input-with-action">
              <input type="text" name="annee_scolaire" value={formData.annee_scolaire || ''} onChange={(e) => handleInputChange(e)} onFocus={() => onHighlight('annee_scolaire', formData.id_annee)} onBlur={onClearHighlight} />
              <button onClick={() => handleSave('annees_scolaires', formData.id_annee, { annee_scolaire: formData.annee_scolaire })}><FaSave /></button>
              <button onClick={() => handleValidate('annees_scolaires', formData.id_annee, formData.annee_scolaire)}><FaCheckCircle /></button>
            </div>
          </div>
          <div className="form-group">
            <label>Correction Nom Niveau (Statut: {formData.statut_niveau})</label>
            <div className="input-with-action">
              <input type="text" name="nom_niveau" value={formData.nom_niveau || ''} onChange={(e) => handleInputChange(e)} onFocus={() => onHighlight('niveau', formData.id_niveau)} onBlur={onClearHighlight} />
              <button onClick={() => handleSave('niveaux', formData.id_niveau, { nom_niveau: formData.nom_niveau })}><FaSave /></button>
              <button onClick={() => handleValidate('niveaux', formData.id_niveau, formData.nom_niveau)}><FaCheckCircle /></button>
            </div>
          </div>
          <div className="form-group">
            <label>Changer le Niveau de la Liste</label>
            <div className="input-with-action">
              <select name="id_niveau" value={formData.id_niveau || ''} onChange={(e) => handleInputChange(e)}>
                {niveauxOptions.map(n => <option key={n.id_niveau} value={n.id_niveau}>{n.nom_niveau}</option>)}
              </select>
              <button onClick={handleSaveNiveauCascade} title="Enregistrer et mettre à jour les manuels associés"><FaSave /></button>
            </div>
          </div>
          <div className="form-group">
            <label>Effectif</label>
            <div className="input-with-action">
              <input type="number" name="effectif" value={formData.effectif || ''} onChange={(e) => handleInputChange(e)} />
              <button onClick={() => handleSave('listes_scolaires', formData.id_liste, { effectif: formData.effectif })}><FaSave /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Tableau des manuels */}
      <div className="form-section">
        <div className="form-section-header">
          <h3>Manuels de la Liste</h3>
          <button className="add-row-button" onClick={handleAddManuelRow}>
            <FaPlus /> Ajouter un manuel
          </button>
        </div>
        <div className="table-wrapper">
          <table className="lists-table editable">
            <thead>
              <tr>
                <th>Titre</th><th>ISBN</th><th>Éditeur</th><th>Type</th><th>Matière</th><th>Année Édition</th><th>Statut</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.manuels?.map((manuel, index) => (
                <tr key={manuel.id_manuel} onClick={() => !manuel.isNew && onManuelSelect(manuel)} className={selectedManuelId === manuel.id_manuel ? 'selected' : ''}>
                  <td><input type="text" name="titre" value={manuel.titre || ''} onChange={(e) => handleInputChange(e, index)} onFocus={() => !manuel.isNew && onHighlight('manuel', manuel.id_manuel)} onBlur={onClearHighlight} /></td>
                  <td><input type="text" name="isbn" value={manuel.isbn || ''} onChange={(e) => handleInputChange(e, index)} onFocus={() => !manuel.isNew && onHighlight('manuel', manuel.id_manuel)} onBlur={onClearHighlight} /></td>
                  <td><input type="text" name="editeur" value={manuel.editeur || ''} onChange={(e) => handleInputChange(e, index)} onFocus={() => !manuel.isNew && onHighlight('manuel', manuel.id_manuel)} onBlur={onClearHighlight} /></td>
                  <td><input type="text" name="type" value={manuel.type || ''} onChange={(e) => handleInputChange(e, index)} onFocus={() => !manuel.isNew && onHighlight('manuel', manuel.id_manuel)} onBlur={onClearHighlight} /></td>
                  <td><input type="text" name="matiere" value={manuel.matiere || ''} onChange={(e) => handleInputChange(e, index)} onFocus={() => !manuel.isNew && onHighlight('manuel', manuel.id_manuel)} onBlur={onClearHighlight} /></td>
                  <td><input type="text" name="annee_edition" value={manuel.annee_edition || ''} onChange={(e) => handleInputChange(e, index)} onFocus={() => !manuel.isNew && onHighlight('manuel', manuel.id_manuel)} onBlur={onClearHighlight} /></td>
                  <td><span className={`status-badge status-${manuel.statut}`}>{manuel.statut.replace('_', ' ')}</span></td>
                  <td className="actions-cell">
                    {manuel.isNew ? (
                      <>
                        <button title="Enregistrer le nouveau manuel" onClick={(e) => { e.stopPropagation(); handleSaveNewManuel(manuel); }}><FaSave /></button>
                        <button title="Annuler l'ajout" className="delete-button" onClick={(e) => { e.stopPropagation(); onDataReload(); }}><FaTrash /></button>
                      </>
                    ) : (
                      <>
                        <button title="Sauvegarder les modifications" onClick={(e) => { 
                          e.stopPropagation(); 
                          const dataToSave = { 
                            titre: manuel.titre, isbn: manuel.isbn, editeur: manuel.editeur, 
                            type: manuel.type, matiere: manuel.matiere, annee_edition: manuel.annee_edition 
                          };
                          handleSave('manuels', manuel.id_manuel, dataToSave); 
                        }}><FaSave /></button>
                        <button title="Valider ce manuel" onClick={(e) => { e.stopPropagation(); handleValidate('manuels', manuel.id_manuel, manuel.titre); }}><FaCheckCircle /></button>
                        <button title="Supprimer ce manuel" className="delete-button" onClick={(e) => { e.stopPropagation(); handleDeleteManuel(manuel.id_manuel, manuel.titre); }}><FaTrash /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Bouton de validation final */}
      <div className="validation-actions">
        <button className="validate-button" onClick={() => handleValidate('listes_scolaires', formData.id_liste, formData.nom_niveau)}>Valider Toute la Liste</button>
      </div>
    </div>
  );
};

export default ValidationForm;