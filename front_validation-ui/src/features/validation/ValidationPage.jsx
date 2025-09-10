// src/features/validation/ValidationPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// --- Services ---
import { getListsByFile } from '../../services/listService';
import { downloadFileAsBlob } from '../../services/driveService';
import { updateEntity } from '../../services/entityService';

// --- Composants ---
import DocumentViewer from './components/DocumentViewer';
import ValidationForm from './components/ValidationForm';
import ReferentielSearchBar from './components/ReferentielSearchBar';

// --- Icônes et Style ---
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import './ValidationPage.css';

const ValidationPage = () => {
  const { sourceFileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [dossierData, setDossierData] = useState(null);
  const [selectedListIndex, setSelectedListIndex] = useState(0);
  const [selectedManuel, setSelectedManuel] = useState(null);
  const [fileBlob, setFileBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentHighlight, setCurrentHighlight] = useState(null);
  const [displayedFileName, setDisplayedFileName] = useState('');

  const fileQueue = searchParams.get('fileQueue')?.split(',') || [];
  const currentIndex = fileQueue.indexOf(sourceFileId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < fileQueue.length - 1 && currentIndex !== -1;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getListsByFile(sourceFileId);
      if (!response.data || !response.data.lists || response.data.lists.length === 0) {
        throw new Error("Aucune liste n'a été trouvée pour ce fichier.");
      }
      setDossierData(response.data);
      setDisplayedFileName(response.data.nom_fichier || '');
      
      const blob = await downloadFileAsBlob(sourceFileId);
      setFileBlob(blob);
    } catch (err) {
      setError(`Impossible de charger les données: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [sourceFileId]);

  useEffect(() => {
    fetchData();
    setSelectedListIndex(0);
    setCurrentHighlight(null);
    setSelectedManuel(null);
  }, [sourceFileId, fetchData]);

  const handleNavigate = (direction) => {
    let nextFileId;
    if (direction === 'next' && hasNext) nextFileId = fileQueue[currentIndex + 1];
    else if (direction === 'prev' && hasPrevious) nextFileId = fileQueue[currentIndex - 1];
    if (nextFileId) navigate(`/validate/${nextFileId}?fileQueue=${fileQueue.join(',')}`);
  };

  const handleHighlight = useCallback((entityType, entityId) => {
    if (!dossierData?.locations) return;
    const locationKey = `${entityType}_${entityId}`;
    setCurrentHighlight(dossierData.locations[locationKey] || null);
  }, [dossierData]);

  const clearHighlight = useCallback(() => setCurrentHighlight(null), []);

  const handleManuelSelect = (manuel) => {
    setSelectedManuel(prev => (prev?.id_manuel === manuel.id_manuel ? null : manuel));
  };
  
  const handleArticleLink = async (selectedArticle) => {
    if (!selectedManuel) return;
    try {
      await updateEntity('manuels', selectedManuel.id_manuel, { id_article_ref: selectedArticle.id_article });
      toast.success('Référence associée !');
      fetchData();
    } catch (error) {
      toast.error(`Erreur d'association.`);
    } finally {
      setSelectedManuel(null);
    }
  };
  
  if (error && !loading) return <div className="error-banner">{error}</div>;

  const currentListData = dossierData?.lists?.[selectedListIndex];

  return (
    <div className="validation-page-container">
      <div className="validation-nav-bar">
        <button onClick={() => navigate('/files')} className="back-button">
          Retour à la liste
        </button>
        {/*<div className="file-name-display">
          Fichier : <strong>{displayedFileName}</strong>
        </div>*/}
        <div className="nav-buttons">
          <button onClick={() => handleNavigate('prev')} disabled={!hasPrevious || loading}>
            <FaArrowLeft /> Précédent
          </button>
          {fileQueue.length > 0 && <span>{`${currentIndex + 1} / ${fileQueue.length}`}</span>}
          <button onClick={() => handleNavigate('next')} disabled={!hasNext || loading}>
            Suivant <FaArrowRight />
          </button>
        </div>
      </div>

      {loading && <div className="loading-overlay">Chargement des données...</div>}
      
      {currentListData && (
        <div className="validation-content-wrapper">
          
          <div className="form-wrapper">
            <div className="form-section list-tabs">
              <h3>Niveaux trouvés dans ce document</h3>
              <div className="tab-buttons-container">
                {dossierData.lists.map((list, index) => (
                  <button 
                    key={list.id_liste} 
                    onClick={() => setSelectedListIndex(index)}
                    className={`tab-button ${index === selectedListIndex ? 'active' : ''}`}
                  >
                    {list.nom_niveau}
                  </button>
                ))}
              </div>
            </div>
            
            <ValidationForm 
              key={currentListData.id_liste}
              listData={currentListData}
              selectedManuelId={selectedManuel?.id_manuel}
              onManuelSelect={handleManuelSelect}
              onHighlight={handleHighlight}
              onClearHighlight={clearHighlight}
              onDataReload={fetchData}
            />
          </div>
          
          <div className="viewer-wrapper">
            <div className="form-section search-section">
              <h3>Associer une Référence au Manuel</h3>
              <ReferentielSearchBar 
                onArticleSelect={handleArticleLink} 
                initialSearchTerm={selectedManuel?.titre || ''}
                isDisabled={!selectedManuel}
              />
              {!selectedManuel && <p className="search-prompt">Sélectionnez une ligne de manuel pour activer la recherche.</p>}
            </div>
            
            <DocumentViewer 
              fileBlob={fileBlob} 
              fileType={currentListData.mime_type} 
              highlight={currentHighlight}
            />
          </div>

        </div>
      )}
    </div>
  );
};

export default ValidationPage;