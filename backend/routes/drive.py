# Prototyping/routes/drive.py
from flask import Blueprint, jsonify, request, Response
from flask_login import login_required
from decorators import admin_required
import google_drive
from config import GOOGLE_DRIVE_FOLDER_ID
from werkzeug.utils import secure_filename
import os
import tempfile
import io
from flask import send_file
import database

drive_bp = Blueprint('drive_bp', __name__)

@drive_bp.route('/files/<string:file_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_drive_file(file_id):
    """[ADMIN] Supprime DÉFINITIVEMENT un fichier de Google Drive."""
    try:
        drive_service = google_drive.get_drive_service()
        drive_service.files().delete(fileId=file_id).execute()
        
        # Optionnel : supprimer aussi le log correspondant dans votre BDD
        # database.delete_log_for_file(file_id)

        return jsonify({"success": True, "message": f"Fichier {file_id} supprimé de Google Drive."})
    except Exception as e:
        return jsonify({"error": f"Erreur lors de la suppression du fichier sur Drive : {str(e)}"}), 500

# L'ajout de fichier est plus complexe et nécessite souvent un frontend dédié
@drive_bp.route('/files/upload', methods=['POST'])
@login_required
def upload_file_to_drive():
    if 'file' not in request.files:
        return jsonify({"error": "Aucun fichier sélectionné"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Aucun fichier sélectionné"}), 400

    filename = secure_filename(file.filename)
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, filename)
    file.save(temp_path)

    try:
        drive_service = google_drive.get_drive_service()
        file_metadata = {
            'name': filename,
            'parents': [GOOGLE_DRIVE_FOLDER_ID]  # dossier partagé
        }
        from googleapiclient.http import MediaFileUpload
        media = MediaFileUpload(temp_path, mimetype=file.mimetype, resumable=False)

        uploaded_file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, parents'
        ).execute()

        # libérer le fichier avant suppression
        del media  

        if os.path.exists(temp_path):
            os.remove(temp_path)

        return jsonify({
            "success": True,
            "file_id": uploaded_file.get('id'),
            "parents": uploaded_file.get('parents'),
            "filename": filename
        }), 201

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": f"Erreur lors de l'upload sur Drive : {str(e)}"}), 500



drive_bp = Blueprint('drive_bp', __name__)

@drive_bp.route('/files/download/<string:file_id>', methods=['GET'])
@login_required
def download_drive_file(file_id):
    db_conn = None
    try:
        # 1. Récupérer le mime_type depuis la BDD
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT mime_type FROM logs_fichiers WHERE id_fichier_drive = %s", (file_id,))
        log_entry = cursor.fetchone()
        
        # Utiliser un type par défaut si non trouvé, mais loguer une erreur
        mime_type = log_entry.get('mime_type', 'application/octet-stream') if log_entry else 'application/octet-stream'

        # 2. Télécharger le fichier depuis Drive
        drive_service = google_drive.get_drive_service()
        request = drive_service.files().get_media(fileId=file_id)
        file_bytes = request.execute()
        
        # 3. Servir le fichier avec le bon mimetype
        return Response(
            file_bytes,
            mimetype=mime_type,
            headers={
                "Content-Disposition": "inline; filename=document",
                "Content-Length": len(file_bytes)
            }
        )
    except Exception as e:
        # Retourner une erreur claire si le fichier ne peut pas être téléchargé
        print(f"Erreur lors du téléchargement du fichier {file_id} depuis Drive: {e}")
        return jsonify({"error": f"Impossible de récupérer le fichier : {str(e)}"}), 500
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()



