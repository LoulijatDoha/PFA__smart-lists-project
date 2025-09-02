# Prototyping/routes/locations.py
from flask import Blueprint, jsonify
from flask_login import login_required
import database

locations_bp = Blueprint('locations_bp', __name__)

@locations_bp.route('/<string:entite_type>/<int:entite_id>', methods=['GET'])
@login_required
def get_location(entite_type, entite_id):
    """Récupère les informations de localisation pour une entité."""
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        query = "SELECT * FROM source_locations WHERE entite_type = %s AND entite_id = %s LIMIT 1"
        cursor.execute(query, (entite_type, entite_id))
        location_data = cursor.fetchone()

        if not location_data:
            return jsonify({"error": "Localisation non trouvée"}), 404
        
        return jsonify(location_data)
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()