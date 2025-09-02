// src/features/validation/components/DocumentViewer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { FaSearchPlus, FaSearchMinus, FaRedo } from 'react-icons/fa';

// --- MODIFICATION : On supprime les deux lignes d'import CSS qui causaient l'erreur ---
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; // <-- SUPPRIMER
// import 'react-pdf/dist/esm/Page/TextLayer.css';     // <-- SUPPRIMER
import './DocumentViewer.css';

// On garde la configuration du worker, elle est essentielle.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const HighlightBox = ({ highlightData }) => {
  if (!highlightData?.coordonnees_json) return null;

  try {
    const outerData = JSON.parse(highlightData.coordonnees_json);
    const bbox = outerData.bounding_box;
    
    if (!Array.isArray(bbox) || bbox.length === 0 || !bbox[0].hasOwnProperty('x') || !bbox[0].hasOwnProperty('y')) {
      console.warn("Format de 'bounding_box' invalide:", bbox);
      return null;
    }

    const xCoords = bbox.map(v => v.x);
    const yCoords = bbox.map(v => v.y);

    const style = {
      left: `${Math.min(...xCoords) * 100}%`,
      top: `${Math.min(...yCoords) * 100}%`,
      width: `${(Math.max(...xCoords) - Math.min(...xCoords)) * 100}%`,
      height: `${(Math.max(...yCoords) - Math.min(...yCoords)) * 100}%`,
    };
    return <div className="highlight-box" style={style} />;
  } catch (e) {
    console.error("Erreur de parsing des coordonnées:", highlightData.coordonnees_json, e);
    return null;
  }
};

const DocumentViewer = ({ fileBlob, fileType, highlight }) => {
  const [numPages, setNumPages] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [scale, setScale] = useState(1.0);
  const pageRefs = useRef([]);

  useEffect(() => {
    if (fileBlob && fileType?.startsWith('image/')) {
      const url = URL.createObjectURL(fileBlob);
      setImageUrl(url); 
      setNumPages(1);
      return () => URL.revokeObjectURL(url);
    }
  }, [fileBlob, fileType]);
  
  useEffect(() => {
    const pageIndex = highlight?.page_number ? highlight.page_number - 1 : -1;
    if (pageIndex >= 0 && pageRefs.current[pageIndex]) {
        pageRefs.current[pageIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlight]);

  if (!fileBlob) return <div className="viewer-placeholder">Chargement du document...</div>;

  return (
    <div className="document-viewer-wrapper">
      <div className="viewer-toolbar">
        <button onClick={() => setScale(s => s + 0.2)}><FaSearchPlus /></button>
        <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))}><FaSearchMinus /></button>
        <button onClick={() => setScale(1.0)}><FaRedo /></button>
        <span>Zoom: {Math.round(scale * 100)}%</span>
      </div>
      <div className="document-content">
        {fileType?.startsWith('image/') && imageUrl && (
          <div className="page-container" ref={el => pageRefs.current[0] = el}>
            <img src={imageUrl} alt="Document" style={{ width: `${scale * 100}%` }} />
            {highlight?.page_number === 1 && <HighlightBox highlightData={highlight} />}
          </div>
        )}
        {fileType === 'application/pdf' && (
          <Document file={fileBlob} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
            {Array.from(new Array(numPages || 0)).map((_, index) => {
              const shouldHighlight = highlight?.page_number === (index + 1);
              return (
                <div key={`page_wrapper_${index + 1}`} className="page-container" ref={el => pageRefs.current[index] = el}>
                  <Page pageNumber={index + 1} scale={scale} />
                  {shouldHighlight && <HighlightBox highlightData={highlight} />}
                </div>
              );
            })}
          </Document>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;