# Prototyping/routes/dashboard.py
from flask import Blueprint, jsonify
from flask_login import login_required
import database

dashboard_bp = Blueprint('dashboard_bp', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        
        stats = {}

        # 1. Compter les fichiers en erreur
        cursor.execute("SELECT COUNT(*) as count FROM logs_fichiers WHERE statut LIKE 'ERREUR%'")
        stats['fichiers_en_erreur'] = cursor.fetchone()['count']

        # 2. Compter les "Dossiers" (fichiers) qui ont au moins une liste à vérifier
        cursor.execute("""
            SELECT COUNT(DISTINCT source_file_id) as count 
            FROM listes_scolaires 
            WHERE statut = 'A_VERIFIER'
        """)
        stats['dossiers_a_verifier'] = cursor.fetchone()['count']
        
        # 3. Compter les "Dossiers" entièrement validés
        cursor.execute("""
            SELECT COUNT(*) FROM (
                SELECT source_file_id 
                FROM listes_scolaires 
                GROUP BY source_file_id 
                HAVING SUM(CASE WHEN statut = 'A_VERIFIER' THEN 1 ELSE 0 END) = 0
            ) as dossiers_valides
        """)
        stats['dossiers_valides'] = cursor.fetchone()['COUNT(*)']

        # 4. Compter le total des dossiers uniques
        cursor.execute("SELECT COUNT(DISTINCT source_file_id) as count FROM listes_scolaires")
        stats['total_dossiers'] = cursor.fetchone()['count']

        return jsonify(stats)
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()