# Prototyping/routes/dashboard.py
from flask import Blueprint, jsonify
from flask_login import login_required
import database

dashboard_bp = Blueprint('dashboard_bp', __name__)


@dashboard_bp.route('/stats', methods=['GET'])
@login_required
def get_stats():
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)

        # Nombre total de fichiers extraits (dossiers)
        cursor.execute("SELECT COUNT(DISTINCT source_file_id) as total FROM listes_scolaires")
        total_dossiers = cursor.fetchone()['total']

        # Fichiers validés vs. à vérifier
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN statut = 'VALIDÉ' THEN 1 ELSE 0 END) as valides,
                SUM(CASE WHEN statut != 'VALIDÉ' THEN 1 ELSE 0 END) as a_verifier
            FROM (
                SELECT source_file_id, MAX(statut) as statut 
                FROM (
                    SELECT source_file_id, 
                           IF(SUM(statut = 'A_VERIFIER') > 0, 'A_VERIFIER', 'VALIDÉ') as statut
                    FROM listes_scolaires GROUP BY source_file_id
                ) as dossier_statuts
                GROUP BY source_file_id
            ) as final_counts
        """)
        dossier_counts = cursor.fetchone()

        # Fichiers en erreur système
        cursor.execute("SELECT COUNT(*) as total FROM logs_fichiers WHERE statut LIKE 'ERREUR%%'")
        fichiers_en_erreur = cursor.fetchone()['total']
        
        # NOUVELLES STATISTIQUES
        # Nombre total de manuels à vérifier
        cursor.execute("SELECT COUNT(*) as total FROM manuels WHERE statut = 'À_VÉRIFIER'")
        manuels_a_verifier = cursor.fetchone()['total']

        stats = {
            'total_dossiers': total_dossiers,
            'dossiers_valides': dossier_counts['valides'] if dossier_counts else 0,
            'dossiers_a_verifier': dossier_counts['a_verifier'] if dossier_counts else 0,
            'fichiers_en_erreur': fichiers_en_erreur,
            'manuels_a_verifier': manuels_a_verifier # Nouvelle stat
        }
        return jsonify(stats)
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()