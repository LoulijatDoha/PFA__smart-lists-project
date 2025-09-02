// src/features/validation/ValidationPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// --- Services ---
import { getListsByFile } from '../../services/listService';
import { downloadFileAsBlob } from '../../services/driveService';
import { updateEntity } from '../../services/entityService';

// --- Composants ---
import DocumentViewer from './components/DocumentViewer';
import ValidationForm from './components/ValidationForm';
import ReferentielSearchBar from './components/ReferentielSearchBar';

// --- Styles ---
import './ValidationPage.css';

const ValidationPage = () => {
  const { sourceFileId } = useParams();
  
  // --- États ---
  const [dossierData, setDossierData] = useState(null);
  const [selectedListIndex, setSelectedListIndex] = useState(0);
  const [selectedManuel, setSelectedManuel] = useState(null);
  const [fileBlob, setFileBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentHighlight, setCurrentHighlight] = useState(null);

  // --- Fonctions de récupération de données ---
  const fetchData = useCallback(async () => {
    if (!sourceFileId) {
      setError("ID de fichier manquant.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await getListsByFile(sourceFileId);
      if (!response.data || !response.data.lists || response.data.lists.length === 0) {
        throw new Error("Aucune liste n'a été trouvée pour ce fichier.");
      }
      setDossierData(response.data);
      
      const blob = await downloadFileAsBlob(sourceFileId);
      setFileBlob(blob);
    } catch (err) {
      setError(`Impossible de charger les données du dossier : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [sourceFileId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // --- Gestionnaires d'événements ---
  const handleHighlight = useCallback((entityType, entityId) => {
    if (!entityType || !entityId || !dossierData?.locations) {
      setCurrentHighlight(null);
      return;
    }
    const locationKey = `${entityType}_${entityId}`;
    setCurrentHighlight(dossierData.locations[locationKey] || null);
  }, [dossierData]);

  const clearHighlight = useCallback(() => setCurrentHighlight(null), []);

  const handleManuelSelect = (manuel) => {
    // Si on clique sur le même manuel, on le désélectionne, sinon on le sélectionne
    setSelectedManuel(prev => (prev?.id_manuel === manuel.id_manuel ? null : manuel));
  };
  
const handleArticleLink = async (selectedArticle) => {
    if (!selectedManuel) return;
    try {
      await updateEntity('manuels', selectedManuel.id_manuel, { id_article_ref: selectedArticle.id_article });
      // --- MODIFICATION 2: Remplacer alert par toast.success ---
      toast.success('Association de la référence réussie !');
      fetchData();
    } catch (error) {
      // --- MODIFICATION 3: Remplacer alert par toast.error ---
      toast.error(`Erreur lors de l'association de la référence.`);
    } finally {
      setSelectedManuel(null);
    }
  };
  
  // --- Rendu ---
  if (loading) return <div>Chargement du dossier de validation...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  
  const currentListData = dossierData?.lists?.[selectedListIndex];
  if (!currentListData) return <div className="error-banner">Aucune liste à afficher pour ce dossier.</div>;
  
  const fileType = currentListData.mime_type;

  return (
    <div className="validation-page-grid">
      <div className="form-column">
        <div className="list-tabs">
          <h3>Niveaux trouvés dans ce document</h3>
          {dossierData.lists.map((list, index) => (
            <button 
              key={list.id_liste} 
              onClick={() => { setSelectedListIndex(index); setSelectedManuel(null); }}
              className={`tab-button ${index === selectedListIndex ? 'active' : ''}`}
            >
              {list.nom_niveau} {list.statut === 'VALIDÉ' && '✅'}
            </button>
          ))}
        </div>
        
        <ValidationForm 
          key={currentListData.id_liste} // La clé force le re-montage du composant si la liste change
          listData={currentListData}
          selectedManuelId={selectedManuel?.id_manuel}
          onManuelSelect={handleManuelSelect}
          onHighlight={handleHighlight}
          onClearHighlight={clearHighlight}
          onDataReload={fetchData}
        />
      </div>
      
      <div className="pdf-column">
        {/* --- MODIFICATION : Barre de recherche déplacée ici --- */}
        <div className="form-section" style={{ marginBottom: '1rem', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3>Associer une Référence au Manuel Sélectionné</h3>
          <ReferentielSearchBar 
            onArticleSelect={handleArticleLink} 
            initialSearchTerm={selectedManuel?.titre || ''}
            isDisabled={!selectedManuel}
          />
          {!selectedManuel && <p className="search-prompt">Cliquez sur une ligne de manuel dans le tableau pour activer la recherche.</p>}
        </div>
        
        <DocumentViewer 
          fileBlob={fileBlob} 
          fileType={fileType} 
          highlight={currentHighlight}
        />
      </div>
    </div>
  );
};

export default ValidationPage;