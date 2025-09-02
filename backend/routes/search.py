# Prototyping/routes/search.py
from flask import Blueprint, jsonify, request
from flask_login import login_required
import database

search_bp = Blueprint('search_bp', __name__)

@search_bp.route('/manuels', methods=['GET'])
@login_required
def search_manuels():
    """
    Recherche des manuels dans toute la base de données.
    Accepte un paramètre de requête ?q=...
    """
    query_term = request.args.get('q', '') # Récupère le terme de recherche 'q' de l'URL
    
    if len(query_term) < 3:
        return jsonify({"error": "Le terme de recherche doit contenir au moins 3 caractères."}), 400

    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        
        # On recherche dans le titre standardisé, le titre brut et l'ISBN
        search_pattern = f"%{query_term}%"
        query = """
            SELECT id_manuel, titre, editeur, type, statut 
            FROM manuels 
            WHERE titre LIKE %s OR isbn LIKE %s
            LIMIT 50
        """
        cursor.execute(query, (search_pattern, search_pattern, search_pattern))
        results = cursor.fetchall()
        
        return jsonify(results)
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()