# Prototyping/routes/referentiel.py
from flask import Blueprint, jsonify, request
from flask_login import login_required
import database

ref_bp = Blueprint('ref_bp', __name__)

@ref_bp.route('/search', methods=['GET'])
@login_required
def search_articles():
    """
    Recherche des articles dans le référentiel.
    Accepte un paramètre de requête ?q=...
    """
    query_term = request.args.get('q', '')
    if len(query_term) < 3:
        return jsonify([])

    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        
        search_pattern = f"%{query_term}%"
        # On recherche dans la désignation, la référence ou le code-barres
        query = """
            SELECT id_article, reference, designation, code_barre 
            FROM referentiel_articles 
            WHERE designation LIKE %s OR reference LIKE %s OR code_barre LIKE %s
            LIMIT 20
        """
        cursor.execute(query, (search_pattern, search_pattern, search_pattern))
        results = cursor.fetchall()
        
        return jsonify(results)
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

