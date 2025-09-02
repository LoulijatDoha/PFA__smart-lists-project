// src/features/dashboard/components/FileUploadModal.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../../../services/fileService';
import { FaFileUpload, FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './FileUploadModal.css';

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
};

const FileUploadModal = ({ onClose, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [globalError, setGlobalError] = useState('');

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setGlobalError('');
    if (fileRejections.length > 0) {
      const firstError = fileRejections[0].errors[0];
      if (firstError.code === 'file-too-large') {
        setGlobalError(`Fichier trop volumineux. La taille maximale est de ${MAX_SIZE_MB} Mo.`);
      } else {
        setGlobalError("Type de fichier non autorisé. Uniquement PDF, JPG, et PNG.");
      }
    } else {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED_FILES, maxSize: MAX_SIZE_BYTES,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadProgress({});
    
    const uploadPromises = files.map(async (file) => {
      try {
        await uploadFile(file);
        setUploadProgress(prev => ({ ...prev, [file.name]: 'success' }));
      } catch (error) {
        console.error(`Erreur sur le fichier ${file.name}:`, error);
        setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }));
      }
    });

    await Promise.all(uploadPromises);
    
    setUploading(false);
    alert('Opération d\'upload terminée.');
    onUploadSuccess();
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* LA CORRECTION : Empêche la fermeture quand on clique sur le contenu */}
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>Ajouter des Fichiers à Traiter</h2>
        
        <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <FaFileUpload className="upload-icon" />
          <p>Glissez-déposez des fichiers ici, ou cliquez pour sélectionner</p>
          <small>Max {MAX_SIZE_MB}Mo par fichier. Formats: PDF, JPG, PNG.</small>
        </div>

        {globalError && <p className="upload-message error">{globalError}</p>}
        
        {files.length > 0 && (
          <div className="file-list-container">
            <h4>Fichiers en attente ({files.length})</h4>
            <ul className="file-list">
              {files.map((file, i) => (
                <li key={i}>
                  <span>{file.name}</span>
                  {uploading && (
                    uploadProgress[file.name] === 'success' ? <FaCheckCircle color="green" /> :
                    uploadProgress[file.name] === 'error' ? <FaExclamationTriangle color="red" /> :
                    <FaSpinner className="spinner" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="modal-actions">
          <button className="button-secondary" onClick={onClose} disabled={uploading}>Annuler</button>
          <button className="button-primary" onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? 'Envoi en cours...' : `Uploader ${files.length} fichier(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;