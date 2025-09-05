# Prototyping/routes/standardisation.py
from flask import Blueprint, jsonify, request
from flask_login import login_required
from decorators import admin_required
import database
import traceback
import mysql.connector

standardisation_bp = Blueprint('standardisation_bp', __name__)

CONFIG = {
    'std-ecoles': {'table': 'standardisation_ecoles', 'pk': 'id'},
    'std-niveaux': {'table': 'standardisation_niveaux', 'pk': 'id'}
}

@standardisation_bp.route('/<string:std_type>', methods=['GET'])
@login_required
@admin_required
def get_std_entries(std_type):
    try:
        if std_type not in CONFIG:
            return jsonify({"error": f"Type '{std_type}' invalide."}), 404
        
        table_name = CONFIG[std_type]['table']
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        offset = (page - 1) * limit
        
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        
        cursor.execute(f"SELECT COUNT(*) as total FROM `{table_name}`")
        total_items = cursor.fetchone()['total']
        
        # Simplified query without DATE_FORMAT
        data_query = (
            "SELECT id, valeur_brute, nom_standardise, statut, score_confiance, "
            "date_creation "
            f"FROM `{table_name}` "
            "ORDER BY id DESC "
            "LIMIT %s OFFSET %s"
        )
        
        cursor.execute(data_query, (limit, offset))
        entries = cursor.fetchall()
        
        # Format dates in Python
        for entry in entries:
            if entry['date_creation']:
                entry['date_creation'] = entry['date_creation'].strftime('%Y-%m-%d %H:%M:%S')
        
        db_conn.close()

        return jsonify({
            'data': entries,
            'total_items': total_items,
            'total_pages': (total_items + limit - 1) // limit,
            'current_page': page
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "Erreur interne du serveur.", 
            "details": traceback.format_exc()
        }), 500
    finally:
        if 'db_conn' in locals() and db_conn and db_conn.is_connected():
            db_conn.close()

@standardisation_bp.route('/<string:std_type>', methods=['POST'])
@login_required
@admin_required
def create_std_entry(std_type):
    if std_type not in CONFIG: return jsonify({"error": f"Type '{std_type}' invalide."}), 404
    data = request.json
    if not all(k in data for k in ['valeur_brute', 'nom_standardise', 'statut']):
        return jsonify({"error": "Champs requis manquants."}), 400
    table = CONFIG[std_type]['table']
    query = f"INSERT INTO `{table}` (valeur_brute, nom_standardise, statut, score_confiance) VALUES (%s, %s, %s, %s)"
    values = (data['valeur_brute'], data['nom_standardise'], data['statut'], data.get('score_confiance'))
    db_conn = database.get_connection()
    try:
        cursor = db_conn.cursor()
        cursor.execute(query, values)
        db_conn.commit()
        return jsonify({"message": "Entrée créée."}), 201
    finally:
        db_conn.close()

@standardisation_bp.route('/<string:std_type>/<int:entry_id>', methods=['PUT'])
@login_required
@admin_required
def update_std_entry(std_type, entry_id):
    if std_type not in CONFIG: return jsonify({"error": f"Type '{std_type}' invalide."}), 404
    data = request.json
    table, pk = CONFIG[std_type]['table'], CONFIG[std_type]['pk']
    set_clause = ", ".join([f"`{key}` = %s" for key in data.keys()])
    values = list(data.values())
    values.append(entry_id)
    db_conn = database.get_connection()
    try:
        cursor = db_conn.cursor()
        cursor.execute(f"UPDATE `{table}` SET {set_clause} WHERE `{pk}` = %s", tuple(values))
        db_conn.commit()
        return jsonify({"message": "Mise à jour réussie."})
    finally:
        db_conn.close()

@standardisation_bp.route('/<string:std_type>/<int:entry_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_std_entry(std_type, entry_id):
    if std_type not in CONFIG: return jsonify({"error": f"Type '{std_type}' invalide."}), 404
    table, pk = CONFIG[std_type]['table'], CONFIG[std_type]['pk']
    db_conn = database.get_connection()
    try:
        cursor = db_conn.cursor()
        cursor.execute(f"DELETE FROM `{table}` WHERE `{pk}` = %s", (entry_id,))
        db_conn.commit()
        return jsonify({"message": "Suppression réussie."})
    finally:
        db_conn.close()