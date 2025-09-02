# Prototyping/routes/standardisation.py
from flask import Blueprint, jsonify, request
from flask_login import login_required
from decorators import admin_required
import database

std_bp = Blueprint('std_bp', __name__)

@std_bp.route('/<string:entity_type>', methods=['GET'])
@login_required
@admin_required
def get_mappings(entity_type):
    """[ADMIN] Récupère tous les mappings pour un type d'entité (ecoles ou niveaux)."""
    if entity_type not in ['ecoles', 'niveaux']:
        return jsonify({"error": "Type d'entité invalide"}), 400
    
    table_name = f"standardisation_{entity_type}"
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(f"SELECT * FROM {table_name} ORDER BY nom_standardise")
        mappings = cursor.fetchall()
        return jsonify(mappings)
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

@std_bp.route('/<string:entity_type>', methods=['POST'])
@login_required
@admin_required
def add_mapping(entity_type):
    """[ADMIN] Ajoute un nouveau mapping de standardisation."""
    if entity_type not in ['ecoles', 'niveaux']:
        return jsonify({"error": "Type d'entité invalide"}), 400
    
    data = request.json
    valeur_brute = data.get('valeur_brute')
    nom_standardise = data.get('nom_standardise')
    if not valeur_brute or not nom_standardise:
        return jsonify({"error": "valeur_brute et nom_standardise sont requis"}), 400
        
    table_name = f"standardisation_{entity_type}"
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()
        query = f"INSERT INTO {table_name} (valeur_brute, nom_standardise, statut) VALUES (%s, %s, 'VALIDÉ')"
        cursor.execute(query, (valeur_brute, nom_standardise))
        db_conn.commit()
        return jsonify({"success": True, "message": "Mapping ajouté."}), 201
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

@std_bp.route('/<string:entity_type>/<int:mapping_id>', methods=['PUT'])
@login_required
@admin_required
def update_mapping(entity_type, mapping_id):
    """[ADMIN] Met à jour un mapping de standardisation."""
    # ... (Logique similaire à update_user, avec un UPDATE sur la table de standardisation)
    pass # À implémenter si nécessaire

@std_bp.route('/<string:entity_type>/<int:mapping_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_mapping(entity_type, mapping_id):
    """[ADMIN] Supprime un mapping de standardisation."""
    if entity_type not in ['ecoles', 'niveaux']:
        return jsonify({"error": "Type d'entité invalide"}), 400
    
    table_name = f"standardisation_{entity_type}"
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()
        query = f"DELETE FROM {table_name} WHERE id = %s"
        cursor.execute(query, (mapping_id,))
        db_conn.commit()
        if cursor.rowcount > 0:
            return jsonify({"success": True, "message": "Mapping supprimé."})
        else:
            return jsonify({"success": False, "message": "Mapping non trouvé."}), 404
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()