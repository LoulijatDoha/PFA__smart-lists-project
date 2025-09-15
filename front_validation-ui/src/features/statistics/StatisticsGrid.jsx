// src/features/dashboard/components/StatisticsGrid.jsx
import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import './StatisticsGrid.css'; // Nous allons mettre à jour ce fichier CSS

// Enregistrement des modules Chart.js nécessaires
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Un composant simple pour afficher un chiffre clé
const StatCard = ({ title, value }) => (
  <div className="stat-highlight-card">
    <span className="stat-value">{value}</span>
    <span className="stat-title">{title}</span>
  </div>
);

const StatisticsGrid = ({ summaryData, loading }) => {
  if (loading || !summaryData) {
    return <div className="statistics-grid-skeleton">Chargement des statistiques détaillées...</div>;
  }

  // --- Configuration des graphiques ---

  // 1. Graphique: Taux de validation des Manuels (Doughnut)
  const manualRateData = {
    labels: ['Manuels Validés', 'Manuels à Vérifier'],
    datasets: [{
      data: [
        summaryData.manual_validation_rate.validated_count,
        summaryData.manual_validation_rate.pending_count
      ],
      backgroundColor: ['#28a745', '#fd7e14'],
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 4,
    }],
  };
  
  // 2. Graphique: Qualité des Fichiers (Doughnut)
  const fileQualityData = {
    labels: ['Traitement Réussi', 'Fichiers en Erreur'],
    datasets: [{
      data: [
        summaryData.file_processing_quality.success_count,
        summaryData.file_processing_quality.error_count
      ],
      backgroundColor: ['#007bff', '#dc3545'],
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 4,
    }],
  };

  // 3. Graphique: Manuels par Niveau (Barres)
  const manualsPerLevelData = {
    labels: summaryData.manuals_per_level.map(item => item.nom_niveau),
    datasets: [{
      label: 'Nombre de manuels',
      data: summaryData.manuals_per_level.map(item => item.manual_count),
      backgroundColor: 'rgba(44, 85, 48, 0.7)',
      borderColor: '#2c5530',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  // Options communes pour les graphiques
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
        legend: { display: false },
        title: { display: true, text: 'Nombre de manuels uniques par niveau scolaire' }
    },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className="statistics-grid-container">
      {/* Carte Chiffre Clé */}
      <StatCard title="Total des Écoles Enregistrées" value={summaryData.total_schools} />

      {/* Graphique 1 */}
      <div className="stat-chart-card">
        <h3>Taux de Validation (Manuels)</h3>
        <div className="chart-wrapper">
          <Doughnut data={manualRateData} options={doughnutOptions} />
        </div>
      </div>
      
      {/* Graphique 2 */}
      <div className="stat-chart-card">
        <h3>Qualité du Traitement (Fichiers)</h3>
        <div className="chart-wrapper">
          <Doughnut data={fileQualityData} options={doughnutOptions} />
        </div>
      </div>

      {/* Graphique 3 (plus grand) */}
      <div className="stat-chart-card large-span">
        <div className="chart-wrapper-large">
          <Bar options={barOptions} data={manualsPerLevelData} />
        </div>
      </div>
    </div>
  );
};

export default StatisticsGrid;