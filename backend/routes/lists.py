# Prototyping/routes/lists.py
from flask import Blueprint, jsonify, request
from flask_login import login_required
import database
import traceback

lists_bp = Blueprint('lists_bp', __name__)

@lists_bp.route('/dossiers_a_valider', methods=['GET'])
@login_required
def get_dossiers_a_valider():
    """
    Récupère une liste paginée ET filtrée des "dossiers" (fichiers sources).
    """
    try:
        # --- 1. Récupération des paramètres (Filtres + Pagination) ---
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        offset = (page - 1) * limit
        
        statut_filter = request.args.get('statut')
        ecole_filter = request.args.get('ecole')
        annee_filter = request.args.get('annee')    
        niveau_filter = request.args.get('niveau')
        
        # --- 2. Construction dynamique et sécurisée de la requête ---
        where_clauses = []
        params = []
        
        if ecole_filter:
            where_clauses.append("e.nom_ecole LIKE %s")
            params.append(f"%{ecole_filter}%")
        if annee_filter:
            where_clauses.append("a.annee_scolaire = %s")
            params.append(annee_filter)
        if niveau_filter:
            where_clauses.append("ls.source_file_id IN (SELECT DISTINCT ls_inner.source_file_id FROM listes_scolaires ls_inner JOIN niveaux n_inner ON ls_inner.id_niveau = n_inner.id_niveau WHERE n_inner.nom_niveau = %s)")
            params.append(niveau_filter)
        
        where_statement = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # --- 3. Construction de la sous-requête pour le filtrage par statut ---
        # Cette sous-requête est essentielle pour compter correctement les résultats filtrés
        subquery_for_filtering = f"""
            SELECT ls.source_file_id, SUM(CASE WHEN ls.statut = 'A_VERIFIER' THEN 1 ELSE 0 END) as listes_a_verifier
            FROM listes_scolaires ls
            JOIN ecoles e ON ls.id_ecole = e.id_ecole
            JOIN annees_scolaires a ON ls.id_annee = a.id_annee
            JOIN niveaux n ON ls.id_niveau = n.id_niveau
            {where_statement}
            GROUP BY ls.source_file_id
        """

        having_clause = ""
        if statut_filter == 'A_VERIFIER':
            having_clause = " HAVING listes_a_verifier > 0"
        elif statut_filter in ('VALIDE', 'VALIDÉ'):
            having_clause = " HAVING listes_a_verifier = 0"
        
        # --- 4. Exécution des requêtes ---
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)

        # Requête de comptage optimisée
        count_query = f"SELECT COUNT(*) as total FROM ({subquery_for_filtering} {having_clause}) as filtered_dossiers"
        cursor.execute(count_query, tuple(params))
        total_items = cursor.fetchone()['total']

        # Requête pour récupérer la page de données actuelle
        data_query = f"""
            SELECT 
                ls.source_file_id, lf.nom_fichier, e.nom_ecole, a.annee_scolaire,
                COUNT(ls.id_liste) as total_listes,
                SUM(CASE WHEN ls.statut = 'A_VERIFIER' THEN 1 ELSE 0 END) as listes_a_verifier
            FROM listes_scolaires ls
            JOIN logs_fichiers lf ON ls.source_file_id = lf.id_fichier_drive
            JOIN ecoles e ON ls.id_ecole = e.id_ecole
            JOIN annees_scolaires a ON ls.id_annee = a.id_annee
            JOIN niveaux n ON ls.id_niveau = n.id_niveau
            {where_statement}
            GROUP BY ls.source_file_id, lf.nom_fichier, e.nom_ecole, a.annee_scolaire
            {having_clause}
            ORDER BY lf.date_traitement DESC
            LIMIT %s OFFSET %s
        """
        
        paginated_params = params + [limit, offset]
        cursor.execute(data_query, tuple(paginated_params))
        dossiers_page = cursor.fetchall()
        
        return jsonify({
            'data': dossiers_page,
            'total_items': total_items,
            'total_pages': (total_items + limit - 1) // limit,
            'current_page': page
        })
        
    except Exception as e:
        print("!!! ERREUR DANS get_dossiers_a_valider !!!")
        traceback.print_exc()
        return jsonify({"error": "Erreur interne du serveur", "details": traceback.format_exc()}), 500
    finally:
        if 'db_conn' in locals() and db_conn.is_connected():
            db_conn.close()


@lists_bp.route('/<int:id_liste>', methods=['GET'])
@login_required
def get_liste_details(id_liste):
    """
    Récupère les détails complets d'une liste (pour la page de validation).
    """
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        query_liste = """
            SELECT 
                ls.id_liste, ls.source_file_id, ls.statut, e.nom_ecole, 
                a.annee_scolaire, n.nom_niveau, lf.mime_type
            FROM listes_scolaires ls
            JOIN ecoles e ON ls.id_ecole = e.id_ecole
            JOIN annees_scolaires a ON ls.id_annee = a.id_annee
            JOIN niveaux n ON ls.id_niveau = n.id_niveau
            LEFT JOIN logs_fichiers lf ON ls.source_file_id = lf.id_fichier_drive
            WHERE ls.id_liste = %s
        """
        cursor.execute(query_liste, (id_liste,))
        liste_details = cursor.fetchone()
        if not liste_details:
            return jsonify({"error": "Liste non trouvée"}), 404
        
        query_manuels = "SELECT * FROM manuels m JOIN liste_manuels lm ON m.id_manuel = lm.id_manuel WHERE lm.id_liste = %s"
        cursor.execute(query_manuels, (id_liste,))
        liste_details['manuels'] = cursor.fetchall()
        
        return jsonify(liste_details)
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()


@lists_bp.route('/by_file/<string:source_file_id>', methods=['GET'])
@login_required
def get_lists_by_file(source_file_id):
    """
    Récupère TOUTES les données pour la page de validation :
    - Les détails des listes (avec leurs manuels)
    - Les coordonnées de toutes les entités du fichier.
    """
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        
        # 1. Récupérer les listes et leurs détails
        query_listes = """
            SELECT 
                ls.id_liste, ls.statut, n.nom_niveau, n.id_niveau,
                e.nom_ecole, e.id_ecole, e.ville,
                a.annee_scolaire, a.id_annee,
                lf.mime_type, ls.source_file_id,ls.effectif
            FROM listes_scolaires ls
            JOIN niveaux n ON ls.id_niveau = n.id_niveau
            JOIN ecoles e ON ls.id_ecole = e.id_ecole
            JOIN annees_scolaires a ON ls.id_annee = a.id_annee
            LEFT JOIN logs_fichiers lf ON ls.source_file_id = lf.id_fichier_drive
            WHERE ls.source_file_id = %s
        """
        cursor.execute(query_listes, (source_file_id,))
        listes = cursor.fetchall()
        if not listes: 
            return jsonify({"lists": [], "locations": {}}) # Retourner une structure vide valide

        # 2. Récupérer les manuels pour chaque liste
        for liste in listes:
            query_manuels = "SELECT * FROM manuels m JOIN liste_manuels lm ON m.id_manuel = lm.id_manuel WHERE lm.id_liste = %s"
            cursor.execute(query_manuels, (liste['id_liste'],))
            liste['manuels'] = cursor.fetchall()
        
        # 3. Récupérer les coordonnées pour TOUTES les entités du fichier
        query_locations = "SELECT entite_type, entite_id, page_number, coordonnees_json FROM source_locations WHERE source_file_id = %s"
        cursor.execute(query_locations, (source_file_id,))
        locations = cursor.fetchall()
        
        # On regroupe les localisations par une clé unique "type_id"
        locations_map = {f"{loc['entite_type']}_{loc['entite_id']}": loc for loc in locations}
        
        # 4. Construire la réponse finale
        response_data = {
            "lists": listes,
            "locations": locations_map
        }
        
        return jsonify(response_data)
        
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()


@lists_bp.route('/<int:list_id>/niveau', methods=['PUT'])
@login_required
def update_liste_et_manuels_niveau(list_id):
    """
    Route spécifique pour mettre à jour le niveau d'une liste ET de tous ses manuels associés.
    """
    data = request.get_json()
    new_niveau_id = data.get('id_niveau')
    if not new_niveau_id:
        return jsonify({"error": "Le nouvel id_niveau est requis."}), 400

    db_conn = None
    try:
        db_conn = database.get_connection()
        # On utilise une transaction pour que les deux mises à jour soient atomiques
        db_conn.start_transaction() 
        cursor = db_conn.cursor()

        # Étape 1: Mettre à jour le niveau de la liste elle-même
        cursor.execute("UPDATE listes_scolaires SET id_niveau = %s WHERE id_liste = %s", (new_niveau_id, list_id))

        # Étape 2: Récupérer les ID de tous les manuels liés à cette liste
        cursor.execute("SELECT id_manuel FROM liste_manuels WHERE id_liste = %s", (list_id,))
        manuel_ids = [row[0] for row in cursor.fetchall()]

        # Étape 3: Mettre à jour le niveau de tous ces manuels (s'il y en a)
        if manuel_ids:
            placeholders = ', '.join(['%s'] * len(manuel_ids))
            query = f"UPDATE manuels SET id_niveau = %s WHERE id_manuel IN ({placeholders})"
            
            values = [new_niveau_id] + manuel_ids
            cursor.execute(query, tuple(values))

        db_conn.commit()
        return jsonify({"message": "Le niveau de la liste et des manuels a été mis à jour."}), 200
    except Exception as e:
        if db_conn: db_conn.rollback()
        return jsonify({"error": "Erreur lors de la mise à jour en cascade.", "details": str(e)}), 500
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()