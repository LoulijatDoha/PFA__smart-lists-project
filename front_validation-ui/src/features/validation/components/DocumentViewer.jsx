// src/features/validation/components/DocumentViewer.jsx

import React, { useState, useEffect } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { FaSearchPlus, FaSearchMinus, FaRedo } from 'react-icons/fa';
import './DocumentViewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const HighlightBox = ({ highlightData }) => {
  // ... (code inchangé, il est correct)
  if (!highlightData?.coordonnees_json) return null;
  try {
    const outerData = JSON.parse(highlightData.coordonnees_json);
    const bbox = outerData.bounding_box;
    if (!Array.isArray(bbox) || bbox.length === 0) return null;
    const xCoords = bbox.map(v => v.x);
    const yCoords = bbox.map(v => v.y);
    const style = {
      left: `${Math.min(...xCoords) * 100}%`,
      top: `${Math.min(...yCoords) * 100}%`,
      width: `${(Math.max(...xCoords) - Math.min(...xCoords)) * 100}%`,
      height: `${(Math.max(...yCoords) - Math.min(...yCoords)) * 100}%`,
    };
    return <div id="highlight-box" className="highlight-box" style={style} />;
  } catch (e) { return null; }
};

const DocumentViewer = ({ fileBlob, fileType, highlight }) => {
  const [numPages, setNumPages] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [scale, setScale] = useState(1.0);
  
  useEffect(() => {
    if (fileBlob && fileType?.startsWith('image/')) {
      const url = URL.createObjectURL(fileBlob);
      setImageUrl(url); 
      setNumPages(1);
      return () => URL.revokeObjectURL(url);
    }
  }, [fileBlob, fileType]);
  
  // --- La logique correcte pour le défilement ---
  useEffect(() => {
    if (highlight) {
      const timer = setTimeout(() => {
        const highlightElement = document.getElementById('highlight-box');
        if (highlightElement) {
          highlightElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  if (!fileBlob) return <div className="viewer-placeholder">Chargement du document...</div>;

  return (
    <div className="document-viewer-wrapper">
      <div className="viewer-toolbar">
        {/* ... */}
      </div>
      <div className="document-content">
        {/* ... */}
        {fileType === 'application/pdf' && (
          <Document file={fileBlob} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
            {Array.from(new Array(numPages || 0)).map((_, index) => {
              const shouldHighlight = highlight?.page_number === (index + 1);
              return (
                <div key={`page_wrapper_${index + 1}`} className="page-container">
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