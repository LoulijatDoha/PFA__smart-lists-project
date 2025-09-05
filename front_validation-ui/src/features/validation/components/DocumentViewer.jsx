// src/features/validation/components/DocumentViewer.jsx
import React, { useState, useEffect } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { FaSearchPlus, FaSearchMinus, FaRedo } from 'react-icons/fa';
import './DocumentViewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

const HighlightBox = ({ highlightData }) => {
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

  useEffect(() => {
    if (highlight) {
      const timer = setTimeout(() => {
        const el = document.getElementById('highlight-box');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  if (!fileBlob) return <div className="viewer-placeholder">Chargement du document...</div>;

  return (
    <div className="document-viewer-wrapper">
      <div className="viewer-toolbar">
        <button onClick={() => setScale(s => s + 0.2)} title="Zoom avant"><FaSearchPlus /></button>
        <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))} title="Zoom arrière"><FaSearchMinus /></button>
        <button onClick={() => setScale(1.0)} title="Réinitialiser le zoom"><FaRedo /></button>
        <span>Zoom: {Math.round(scale * 100)}%</span>
      </div>

      <div className="document-content">
        {fileType?.startsWith('image/') && imageUrl && (
          <div className="page-container">
            <img src={imageUrl} alt="Document" style={{ width: `${scale * 100}%`, height: 'auto' }} />
            {highlight?.page_number === 1 && <HighlightBox highlightData={highlight} />}
          </div>
        )}
        {fileType === 'application/pdf' && (
          <Document file={fileBlob} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
            {Array.from(new Array(numPages || 0)).map((_, index) => {
              const shouldHighlight = highlight?.page_number === (index + 1);
              return (
                <div key={`page_wrapper_${index + 1}`} className="page-container">
                  <Page pageNumber={index + 1} scale={scale} renderTextLayer={false} />
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