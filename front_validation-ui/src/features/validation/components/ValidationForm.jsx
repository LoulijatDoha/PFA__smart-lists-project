// src/features/validation/components/ValidationForm.jsx

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // On garde l'import de react-hot-toast
import { validateEntity, updateEntity } from '../../../services/entityService';
import { getAllNiveaux } from '../../../services/niveauService';
import { updateListNiveau } from '../../../services/listService';
import { FaSave, FaCheckCircle } from 'react-icons/fa';
import './ValidationForm.css';

const ValidationForm = ({ listData, selectedManuelId, onManuelSelect, onHighlight, onClearHighlight, onDataReload }) => {
  const [formData, setFormData] = useState(listData);
  const [niveauxOptions, setNiveauxOptions] = useState([]);
  
  useEffect(() => {
    setFormData(listData);
    if (niveauxOptions.length === 0) {
      getAllNiveaux().then(res => setNiveauxOptions(res.data));
    }
  }, [listData, niveauxOptions.length]);

  if (!formData) return null;

  const handleInputChange = (e, index = null) => {
    const { name, value } = e.target;
    if (index === null) {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        manuels: prev.manuels.map((m, i) => i === index ? { ...m, [name]: value } : m)
      }));
    }
  };

  // Cette fonction reste inchangée pour le moment
  const handleSave = async (entityType, entityId, dataToSave) => {
    try {
      await updateEntity(entityType, entityId, dataToSave);
      toast.success('Modification enregistrée !');
      onDataReload(); // On garde le rechargement pour l'instant
    } catch (error) {
      toast.error(`Erreur de sauvegarde : ${error.response?.data?.error || error.message}`);
    }
  };
  
  // --- C'EST ICI QUE LA MODIFICATION A LIEU ---
  const handleValidate = async (entityType, entityId, entityStatut, entityName = '') => {
    // On garde la confirmation native pour cette étape
    if (!window.confirm(`Valider : ${entityType} "${entityName}" (ID: ${entityId}) ?`)) return;
    
    try {
      await validateEntity(entityType, entityId);
      toast.success(`${entityType} validé !`);
      onDataReload();
    } catch (error) {
      // **LA CORRECTION :** On vérifie le code d'erreur spécifique
      if (error.response?.status === 409) { // 409 Conflict = "Déjà validé"
        // On affiche une notification informative, pas une erreur
        toast(`Cet élément est déjà validé.`, { icon: 'ℹ️' });
      } else {
        // Pour toutes les autres erreurs, on affiche un message d'erreur générique
        toast.error(`Erreur de validation: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  // Cette fonction reste inchangée
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

  return (
    <div className="validation-form-container">
      <div className="form-section">
        <h3>Informations Générales</h3>
        <div className="form-grid">
          <div className="form-group" onMouseOver={() => onHighlight('ecole', formData.id_ecole)} onMouseOut={onClearHighlight}>
            <label>École (Statut: {formData.statut_ecole})</label>
            <div className="input-with-action">
              <input type="text" name="nom_ecole" value={formData.nom_ecole || ''} onChange={handleInputChange} />
              <button onClick={() => handleSave('ecoles', formData.id_ecole, { nom_ecole: formData.nom_ecole, ville: formData.ville })}><FaSave /></button>
              <button onClick={() => handleValidate('ecoles', formData.id_ecole, formData.statut_ecole, formData.nom_ecole)}><FaCheckCircle /></button>
            </div>
          </div>
          
          <div className="form-group" onMouseOver={() => onHighlight('ecole', formData.id_ecole)} onMouseOut={onClearHighlight}>
            <label>Ville</label>
            <input type="text" name="ville" value={formData.ville || ''} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label>Année Scolaire (Statut: {formData.statut_annee})</label>
            <div className="input-with-action">
              <input type="text" name="annee_scolaire" value={formData.annee_scolaire || ''} onChange={handleInputChange} />
              <button onClick={() => handleSave('annees_scolaires', formData.id_annee, { annee_scolaire: formData.annee_scolaire })}><FaSave /></button>
              <button onClick={() => handleValidate('annees_scolaires', formData.id_annee, formData.statut_annee, formData.annee_scolaire)}><FaCheckCircle /></button>
            </div>
          </div>
          
          <div className="form-group" onMouseOver={() => onHighlight('niveau', formData.id_niveau)} onMouseOut={onClearHighlight}>
            <label>Correction Nom Niveau (Statut: {formData.statut_niveau})</label>
            <div className="input-with-action">
              <input type="text" name="nom_niveau" value={formData.nom_niveau || ''} onChange={handleInputChange} />
              <button onClick={() => handleSave('niveaux', formData.id_niveau, { nom_niveau: formData.nom_niveau })}><FaSave /></button>
              <button onClick={() => handleValidate('niveaux', formData.id_niveau, formData.statut_niveau, formData.nom_niveau)}><FaCheckCircle /></button>
            </div>
          </div>

          <div className="form-group">
            <label>Changer le Niveau de la Liste</label>
             <div className="input-with-action">
              <select name="id_niveau" value={formData.id_niveau || ''} onChange={handleInputChange}>
                {niveauxOptions.map(n => <option key={n.id_niveau} value={n.id_niveau}>{n.nom_niveau}</option>)}
              </select>
              <button onClick={handleSaveNiveauCascade} title="Enregistrer et mettre à jour les manuels associés"><FaSave /></button>
            </div>
          </div>
          
          <div className="form-group">
            <label>Effectif</label>
            <div className="input-with-action">
              <input type="number" name="effectif" value={formData.effectif || ''} onChange={handleInputChange} />
              <button onClick={() => handleSave('listes_scolaires', formData.id_liste, { effectif: formData.effectif })}><FaSave /></button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="form-section">
        <h3>Manuels de la Liste</h3>
        <div className="table-wrapper">
          <table className="lists-table editable">
            <thead>
              <tr><th>Titre</th><th>Type</th><th>Éditeur</th><th>Référence</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {formData.manuels?.map((manuel, index) => (
                <tr key={manuel.id_manuel} onClick={() => onManuelSelect(manuel)} className={selectedManuelId === manuel.id_manuel ? 'selected' : ''} onMouseOver={() => onHighlight('manuel', manuel.id_manuel)} onMouseOut={onClearHighlight}>
                  <td><input type="text" name="titre" value={manuel.titre || ''} onChange={(e) => handleInputChange(e, index)} /></td>
                  <td><input type="text" name="type" value={manuel.type || ''} onChange={(e) => handleInputChange(e, index)} /></td>
                  <td><input type="text" name="editeur" value={manuel.editeur || ''} onChange={(e) => handleInputChange(e, index)} /></td>
                  <td>{manuel.id_article_ref ? `Réf: ${manuel.ref_reference}` : <span className="no-reference">Non Associé</span>}</td>
                  <td><span className={`status-badge status-${manuel.statut}`}>{manuel.statut}</span></td>
                  <td>
                    <button onClick={(e) => { e.stopPropagation(); handleSave('manuels', manuel.id_manuel, { titre: manuel.titre, type: manuel.type, editeur: manuel.editeur }); }}><FaSave /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleValidate('manuels', manuel.id_manuel, manuel.statut, manuel.titre); }}><FaCheckCircle /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="validation-actions">
        <button className="validate-button" onClick={() => handleValidate('listes_scolaires', formData.id_liste, formData.statut, formData.nom_niveau)}>
          Valider Toute la Liste
        </button>
      </div>
    </div>
  );
};

export default ValidationForm;