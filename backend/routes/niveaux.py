# Prototyping/routes/niveaux.py
from flask import Blueprint, jsonify
from flask_login import login_required
import database

niveaux_bp = Blueprint('niveaux_bp', __name__)

@niveaux_bp.route('', methods=['GET'])
@login_required
def get_all_niveaux():
    """Récupère tous les niveaux pour les menus déroulants."""
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT id_niveau, nom_niveau FROM niveaux ORDER BY id_niveau")
        return jsonify(cursor.fetchall())
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()