# Prototyping/routes/entities.py

from flask import Blueprint, jsonify, request
from flask_login import login_required
import database
import logging
# On importe le module d'erreurs de MySQL pour gérer les contraintes de clé étrangère
import mysql.connector

entities_bp = Blueprint('entities_bp', __name__)

ENTITY_CONFIG = {
    'ecoles':           {'table': 'ecoles',           'pk': 'id_ecole'},
    'manuels':          {'table': 'manuels',          'pk': 'id_manuel'},
    'niveaux':          {'table': 'niveaux',          'pk': 'id_niveau'},
    'annees_scolaires': {'table': 'annees_scolaires', 'pk': 'id_annee'},
    'listes_scolaires': {'table': 'listes_scolaires', 'pk': 'id_liste'}
}

# --- Les routes pour /annees_scolaires et /niveaux ne changent pas ---
@entities_bp.route('/annees_scolaires', methods=['GET'])
@login_required
def get_annee_options():
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT id_annee, annee_scolaire FROM annees_scolaires ORDER BY annee_scolaire DESC")
        return jsonify(cursor.fetchall())
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

@entities_bp.route('/niveaux', methods=['GET'])
@login_required
def get_niveau_options():
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT id_niveau, nom_niveau FROM niveaux ORDER BY id_niveau")
        return jsonify(cursor.fetchall())
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

# --- La route de mise à jour ne change pas ---
@entities_bp.route('/<string:entity_type>/<int:entity_id>', methods=['PUT'])
@login_required
def update_entity(entity_type, entity_id):
    if entity_type not in ENTITY_CONFIG:
        return jsonify({"error": f"Le type d'entité '{entity_type}' est invalide."}), 400
    config = ENTITY_CONFIG[entity_type]
    table_name = config['table']
    pk_column = config['pk']
    data = request.get_json()
    if not data:
        return jsonify({"error": "Corps de la requête vide."}), 400
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()
        cursor.execute(f"SELECT {pk_column} FROM {table_name} WHERE {pk_column} = %s", (entity_id,))
        if cursor.fetchone() is None:
            return jsonify({"error": f"L'entité '{entity_type}' avec l'ID {entity_id} n'a pas été trouvée."}), 404
        set_clause = ", ".join([f"{key} = %s" for key in data.keys()])
        values = list(data.values())
        values.append(entity_id)
        query = f"UPDATE {table_name} SET {set_clause} WHERE {pk_column} = %s"
        cursor.execute(query, tuple(values))
        db_conn.commit()
        return jsonify({"message": "Mise à jour réussie."}), 200
    except Exception as e:
        if db_conn: db_conn.rollback()
        return jsonify({"error": "Erreur lors de la mise à jour.", "details": str(e)}), 500
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

# --- La route de validation ne change pas ---
@entities_bp.route('/<string:entity_type>/<int:entity_id>/validate', methods=['POST'])
@login_required
def validate_entity(entity_type, entity_id):
    if entity_type not in ENTITY_CONFIG:
        return jsonify({"error": f"Le type d'entité '{entity_type}' est invalide."}), 400
    config = ENTITY_CONFIG[entity_type]
    table_name = config['table']
    pk_column = config['pk']
    db_conn = None
    cursor = None
    try:
        db_conn = database.get_connection()
        if not db_conn:
            raise Exception("La connexion à la base de données a échoué.")
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(f"SELECT statut FROM {table_name} WHERE {pk_column} = %s", (entity_id,))
        result = cursor.fetchone()
        if not result:
            return jsonify({"error": f"L'entité '{entity_type}' avec l'ID {entity_id} n'a pas été trouvée."}), 404
        if result['statut'] == 'VALIDÉ':
            return jsonify({"error": "Cette entité est déjà validée."}), 409
        cursor.execute(f"UPDATE {table_name} SET statut = 'VALIDÉ' WHERE {pk_column} = %s", (entity_id,))
        db_conn.commit()
        return jsonify({"message": "Validation réussie."}), 200
    except Exception as e:
        logging.exception("Une erreur est survenue dans validate_entity:")
        if db_conn: db_conn.rollback()
        return jsonify({"error": "Erreur lors de la validation.", "details": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if db_conn and db_conn.is_connected():
            db_conn.close()

# --- AJOUT DE LA ROUTE MANQUANTE POUR LA SUPPRESSION ---
@entities_bp.route('/<string:entity_type>/<int:entity_id>', methods=['DELETE'])
@login_required
def delete_entity(entity_type, entity_id):
    if entity_type not in ENTITY_CONFIG:
        return jsonify({"error": f"Le type d'entité '{entity_type}' est invalide."}), 400

    config = ENTITY_CONFIG[entity_type]
    table_name = config['table']
    pk_column = config['pk']

    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()

        # Étape 1: Vérifier si l'entité existe
        cursor.execute(f"SELECT {pk_column} FROM {table_name} WHERE {pk_column} = %s", (entity_id,))
        if cursor.fetchone() is None:
            return jsonify({"error": f"L'entité '{entity_type}' avec l'ID {entity_id} n'a pas été trouvée."}), 404

        # Étape 2: Tenter la suppression
        cursor.execute(f"DELETE FROM {table_name} WHERE {pk_column} = %s", (entity_id,))
        db_conn.commit()
        
        return jsonify({"message": "Suppression réussie."}), 200

    except mysql.connector.Error as err:
        if db_conn: db_conn.rollback()
        # ER_ROW_IS_REFERENCED_2 est le code d'erreur pour une violation de clé étrangère
        if err.errno == 1451: 
            return jsonify({"error": "Cet élément ne peut pas être supprimé car il est utilisé par d'autres données."}), 409 # 409 Conflict
        else:
            return jsonify({"error": "Erreur de base de données.", "details": str(err)}), 500
            
    except Exception as e:
        if db_conn: db_conn.rollback()
        return jsonify({"error": "Erreur lors de la suppression.", "details": str(e)}), 500
        
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()