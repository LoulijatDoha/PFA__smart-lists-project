// src/components/shared/Pagination.jsx
import React, { useMemo } from 'react';
import { FaAngleDoubleLeft, FaAngleLeft, FaAngleRight, FaAngleDoubleRight } from 'react-icons/fa';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // --- Logique pour générer les numéros de page à afficher ---
  const pageNumbers = useMemo(() => {
    const delta = 2; // Nombre de pages à afficher de chaque côté de la page actuelle
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    // Supprime les doublons (si totalPages est petit)
    return [...new Set(range)]; 
  }, [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-container">
      <button 
        className="pagination-button"
        onClick={() => onPageChange(1)} 
        disabled={currentPage === 1}
        title="Première page"
      >
        <FaAngleDoubleLeft />
      </button>
      <button 
        className="pagination-button"
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        title="Page précédente"
      >
        <FaAngleLeft />
      </button>
      
      {pageNumbers.map((page, index) => 
        typeof page === 'number' ? (
          <button 
            key={page}
            className={`pagination-button ${page === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ) : (
          <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
        )
      )}

      <button 
        className="pagination-button"
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        title="Page suivante"
      >
        <FaAngleRight />
      </button>
      <button 
        className="pagination-button"
        onClick={() => onPageChange(totalPages)} 
        disabled={currentPage === totalPages}
        title="Dernière page"
      >
        <FaAngleDoubleRight />
      </button>
    </div>
  );
};

export default Pagination;