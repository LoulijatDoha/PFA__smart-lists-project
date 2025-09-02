# Prototyping/routes/logs.py
from flask import Blueprint, jsonify, request
from flask_login import login_required
from decorators import admin_required
import database

logs_bp = Blueprint('logs_bp', __name__)

@logs_bp.route('', methods=['GET'])
@login_required
@admin_required
def get_logs():
    """
    Récupère les logs, avec possibilité de filtrer par statut.
    Ex: /api/v1/logs?statut=ERREUR
    """
    statut_filter = request.args.get('statut')
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        
        query = "SELECT id_fichier_drive, nom_fichier, statut, error_message, date_traitement FROM logs_fichiers"
        params = []
        
        if statut_filter == 'ERREUR':
            # Regroupe tous les types d'erreurs (ERREUR, ERREUR_OCR, etc.)
            query += " WHERE statut LIKE 'ERREUR%'"
        elif statut_filter:
            query += " WHERE statut = %s"
            params.append(statut_filter)
            
        query += " ORDER BY date_traitement DESC"
        
        cursor.execute(query, tuple(params))
        logs = cursor.fetchall()
        
        # Convertir les objets datetime en chaînes de caractères pour le JSON
        for log in logs:
            if log.get('date_traitement'):
                log['date_traitement'] = log['date_traitement'].isoformat()
        
        return jsonify(logs)
    except Exception as e:
        print(f"Erreur lors de la récupération des logs: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()