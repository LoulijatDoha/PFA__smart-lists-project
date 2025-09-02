# Prototyping/routes/files.py (Version Améliorée)
from flask import Blueprint, jsonify
from flask_login import login_required
from decorators import admin_required
import database

files_bp = Blueprint('files_bp', __name__)

@files_bp.route('/logs', methods=['GET'])
@login_required
@admin_required # Seuls les admins peuvent voir tous les logs
def get_all_logs():
    """[ADMIN] Récupère tous les logs de traitement de fichiers."""
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM logs_fichiers ORDER BY date_traitement DESC")
        logs = cursor.fetchall()
        # Convertir les objets datetime en chaînes pour la sérialisation JSON
        for log in logs:
            if 'date_traitement' in log and log['date_traitement']:
                log['date_traitement'] = log['date_traitement'].isoformat()
        return jsonify(logs)
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

@files_bp.route('/<string:file_id>/reprocess', methods=['POST'])
@login_required
@admin_required # Seul un admin peut relancer un traitement
def reprocess_file(file_id):
    """
    Marque un fichier pour être retraité lors de la prochaine exécution de main.py.
    """
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()
        
        # On supprime simplement le log du fichier.
        # Au prochain lancement, main.py le verra comme un "nouveau" fichier.
        query = "DELETE FROM logs_fichiers WHERE id_fichier_drive = %s"
        cursor.execute(query, (file_id,))
        db_conn.commit()
        
        if cursor.rowcount > 0:
            return jsonify({"success": True, "message": f"Le fichier {file_id} sera retraité au prochain lancement."})
        else:
            return jsonify({"success": False, "message": "Fichier non trouvé dans les logs."}), 404
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()