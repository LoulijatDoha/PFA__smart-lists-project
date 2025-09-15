# Prototyping/routes/statistics.py
from flask import Blueprint, jsonify
from flask_login import login_required
import database
import traceback

statistics_bp = Blueprint('statistics_bp', __name__)

@statistics_bp.route('/summary', methods=['GET'])
@login_required
def get_statistics_summary():
    """
    Récupère un résumé complet des statistiques clés de l'application.
    """
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        
        summary_data = {}
        
        # 1. Taux de validation des manuels
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN statut = 'VALIDÉ' THEN 1 END) as validated_count,
                COUNT(CASE WHEN statut = 'À_VÉRIFIER' THEN 1 END) as pending_count
            FROM manuels
        """)
        summary_data['manual_validation_rate'] = cursor.fetchone()
        
        # 2. Qualité des fichiers sources (Succès vs Erreur)
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN statut NOT LIKE 'ERREUR%%' THEN 1 END) as success_count,
                COUNT(CASE WHEN statut LIKE 'ERREUR%%' THEN 1 END) as error_count
            FROM logs_fichiers
        """)
        summary_data['file_processing_quality'] = cursor.fetchone()
        
        # 3. Nombre total d'écoles enregistrées
        cursor.execute("SELECT COUNT(id_ecole) as total_schools FROM ecoles")
        summary_data['total_schools'] = cursor.fetchone()['total_schools']
        
        # 4. Nombre de manuels par niveau scolaire (pour un graphique à barres)
        cursor.execute("""
            SELECT n.nom_niveau, COUNT(m.id_manuel) as manual_count
            FROM manuels m
            JOIN niveaux n ON m.id_niveau = n.id_niveau
            GROUP BY n.nom_niveau
            ORDER BY n.id_niveau
        """)
        summary_data['manuals_per_level'] = cursor.fetchall()
        
        return jsonify(summary_data)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Erreur interne du serveur", "details": str(e)}), 500
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()