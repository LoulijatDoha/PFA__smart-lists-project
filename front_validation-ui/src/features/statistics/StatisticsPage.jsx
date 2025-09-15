// src/features/statistics/StatisticsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getStatisticsSummary } from '../../services/statisticsService';
import StatisticsGrid from './StatisticsGrid';
import './StatisticsPage.css'; // Nous allons créer ce fichier CSS

const StatisticsPage = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const summaryRes = await getStatisticsSummary();
      setSummaryData(summaryRes.data);
    } catch (err) {
      setError("Impossible de charger les statistiques détaillées.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="statistics-page">
      <div className="page-header">
        <h1>Statistiques et Analyses</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* On réutilise le composant que nous avions déjà créé */}
      <StatisticsGrid summaryData={summaryData} loading={isLoading} />

    </div>
  );
};

export default StatisticsPage;