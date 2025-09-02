# Prototyping/routes/manuels.py (Version Améliorée)
from flask import Blueprint, jsonify, request
from flask_login import login_required
from decorators import admin_required
import database

manuels_bp = Blueprint('manuels_bp', __name__)


@manuels_bp.route('/<int:id_manuel>', methods=['PUT'])
@login_required
def update_manuel(id_manuel):
    """Met à jour les informations d'un manuel."""
    data = request.json
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()
        
        fields, values = [], []
        allowed_keys = ['titre', 'editeur', 'annee_edition', 'isbn', 'type', 'matiere', 'statut']
        for key, value in data.items():
            if key in allowed_keys:
                fields.append(f"{key} = %s")
                values.append(value)
        
        if not fields:
            return jsonify({"error": "Aucun champ valide à mettre à jour"}), 400

        values.append(id_manuel)
        query = f"UPDATE manuels SET {', '.join(fields)} WHERE id_manuel = %s"
        cursor.execute(query, tuple(values))
        db_conn.commit()
        
        return jsonify({"success": True, "message": f"Manuel {id_manuel} mis à jour."})
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

@manuels_bp.route('/<int:id_manuel>/link/<int:id_liste>', methods=['DELETE'])
@login_required
def unlink_manuel_from_list(id_manuel, id_liste):
    """Supprime le lien entre un manuel et une liste."""
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()
        query = "DELETE FROM liste_manuels WHERE id_manuel = %s AND id_liste = %s"
        cursor.execute(query, (id_manuel, id_liste))
        db_conn.commit()
        # rowcount vérifie si une ligne a bien été supprimée
        if cursor.rowcount > 0:
            return jsonify({"success": True, "message": "Lien manuel-liste supprimé."})
        else:
            return jsonify({"success": False, "message": "Lien non trouvé."}), 404
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

            
@manuels_bp.route('/merge', methods=['POST'])
@login_required
@admin_required # Seul un admin peut fusionner des données
def merge_manuels():
    """
    Fusionne deux manuels.
    Le 'manuel_a_supprimer' sera supprimé et tous ses liens seront
    transférés au 'manuel_a_garder'.
    """
    data = request.json
    id_a_garder = data.get('id_manuel_a_garder')
    id_a_supprimer = data.get('id_manuel_a_supprimer')

    if not id_a_garder or not id_a_supprimer or id_a_garder == id_a_supprimer:
        return jsonify({"error": "Veuillez fournir deux IDs de manuel différents."}), 400

    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()

        # 1. Mettre à jour la table des liens (liste_manuels)
        # On ignore les erreurs de duplication de clé (si le lien existait déjà)
        update_links_query = """
            UPDATE IGNORE liste_manuels 
            SET id_manuel = %s 
            WHERE id_manuel = %s
        """
        cursor.execute(update_links_query, (id_a_garder, id_a_supprimer))

        # 2. Mettre à jour la table des localisations (source_locations)
        update_locations_query = "UPDATE source_locations SET entite_id = %s WHERE entite_type = 'manuel' AND entite_id = %s"
        cursor.execute(update_locations_query, (id_a_garder, id_a_supprimer))
        
        # 3. Supprimer les liens restants du manuel à supprimer (ceux qui étaient des doublons)
        delete_links_query = "DELETE FROM liste_manuels WHERE id_manuel = %s"
        cursor.execute(delete_links_query, (id_a_supprimer,))

        # 4. Supprimer le manuel devenu inutile
        delete_manuel_query = "DELETE FROM manuels WHERE id_manuel = %s"
        cursor.execute(delete_manuel_query, (id_a_supprimer,))

        db_conn.commit()

        return jsonify({"success": True, "message": f"Le manuel {id_a_supprimer} a été fusionné dans le manuel {id_a_garder}."})

    except Exception as e:
        if db_conn:
            db_conn.rollback() # Annule toutes les opérations en cas d'erreur
        return jsonify({"error": str(e)}), 500
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()


@manuels_bp.route('/manuels', methods=['GET'])
@login_required
def get_manuel_suggestions():
    """
    Fournit des suggestions de manuels existants basées sur un terme de recherche.
    Utilisé pour l'auto-complétion dans le formulaire de validation.
    """
    query_term = request.args.get('q', '')
    if len(query_term) < 3:
        return jsonify([]) # Retourne une liste vide si la recherche est trop courte

    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        
        search_pattern = f"%{query_term}%"
        # On recherche sur un titre standardisé distinct pour éviter les quasi-doublons
        query = """
            SELECT DISTINCT titre, editeur 
            FROM manuels 
            WHERE titre LIKE %s 
            ORDER BY titre 
            LIMIT 10
        """
        cursor.execute(query, (search_pattern,))
        results = cursor.fetchall()
        
        return jsonify(results)
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()