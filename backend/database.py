# database.py
import mysql.connector
import json
from config import DB_CONFIG

def get_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print("Connexion à la base de données réussie.")
        return conn
    except Exception as e:
        print(f"Erreur de connexion à la BDD: {e}")
        raise

def get_fichiers_traites(conn):
    """Récupère les IDs des fichiers déjà traités avec succès (statut TRAITÉ)."""
    cursor = conn.cursor()
    # On ne filtre que les fichiers TRAITÉS avec succès pour ne pas les relancer.
    # Ceux en erreur (ERREUR_EXTRACTION, etc.) seront retraités.
    query = "SELECT id_fichier_drive FROM logs_fichiers WHERE statut = 'TRAITÉ'"
    cursor.execute(query)
    fichiers_traites = {row[0] for row in cursor.fetchall()}
    cursor.close()
    return fichiers_traites

def get_standardisation_knowledge_base(conn, entity_type: str):
    cursor = conn.cursor(dictionary=True)
    query = f"SELECT valeur_brute, nom_standardise FROM standardisation_{entity_type} WHERE statut = 'VALIDÉ'"
    cursor.execute(query)
    knowledge_base = cursor.fetchall()
    cursor.close()
    if not knowledge_base:
        print(f"    -> AVERTISSEMENT: La base de connaissances pour '{entity_type}' est vide.")
    return knowledge_base

def learn_new_standardisation(conn, valeur_brute: str, nom_standardise: str, entity_type: str):
    if not all([valeur_brute, nom_standardise, entity_type]): return
    valeur_propre = ' '.join(valeur_brute.lower().strip().split())
    cursor = conn.cursor()
    query = f"""
        INSERT INTO standardisation_{entity_type} (valeur_brute, nom_standardise, statut)
        VALUES (%s, %s, 'À_VÉRIFIER')
        ON DUPLICATE KEY UPDATE nom_standardise = VALUES(nom_standardise), statut = 'À_VÉRIFIER'
    """
    try:
        cursor.execute(query, (valeur_propre, nom_standardise))
        conn.commit()
    except Exception as e:
        print(f"    -> ERREUR lors de l'apprentissage de la standardisation pour '{valeur_brute}': {e}")
    finally:
        cursor.close()

def get_or_create_entity_id(conn, cache_dict, entity_value, table_name, column_name):
    if not entity_value or not isinstance(entity_value, str): return None
    cache_key = f"{table_name}:{entity_value}"
    if cache_key in cache_dict: return cache_dict[cache_key]
    id_column_map = {'ecoles': 'id_ecole', 'annees_scolaires': 'id_annee', 'niveaux': 'id_niveau'}
    id_column_name = id_column_map.get(table_name)
    if not id_column_name: raise ValueError(f"Clé primaire manquante pour la table '{table_name}'")
    cursor = conn.cursor()
    query_select = f"SELECT {id_column_name} FROM {table_name} WHERE {column_name} = %s"
    cursor.execute(query_select, (entity_value,))
    result = cursor.fetchone()
    entity_id = result[0] if result else None
    if not entity_id:
        query_insert = f"INSERT INTO {table_name} ({column_name}, statut) VALUES (%s, 'À_VÉRIFIER')"
        cursor.execute(query_insert, (entity_value,))
        conn.commit()
        entity_id = cursor.lastrowid
    cache_dict[cache_key] = entity_id
    cursor.close()
    return entity_id

def get_or_create_liste_id(conn, id_ecole, id_annee, id_niveau, source_file_id):
    cursor = conn.cursor()
    query_select = "SELECT id_liste FROM listes_scolaires WHERE id_ecole = %s AND id_annee = %s AND id_niveau = %s"
    cursor.execute(query_select, (id_ecole, id_annee, id_niveau))
    result = cursor.fetchone()
    liste_id = result[0] if result else None
    if not liste_id:
        query_insert = "INSERT INTO listes_scolaires (id_ecole, id_annee, id_niveau, source_file_id, statut) VALUES (%s, %s, %s, %s, 'A_VERIFIER')"
        cursor.execute(query_insert, (id_ecole, id_annee, id_niveau, source_file_id))
        conn.commit()
        liste_id = cursor.lastrowid
    cursor.close()
    return liste_id

def inserer_manuel(conn, manuel_data, id_niveau):
    cursor = conn.cursor()
    colonnes = ['titre', 'editeur', 'annee_edition', 'isbn', 'type', 'matiere', 'id_niveau', 'statut']
    donnees = (manuel_data.get('titre_livre'), manuel_data.get('maison_edition'), manuel_data.get('annee_edition'), manuel_data.get('code_livre'), manuel_data.get('type_livre'), manuel_data.get('matiere'), id_niveau, 'À_VÉRIFIER')
    placeholders = ', '.join(['%s'] * len(colonnes))
    query = f"INSERT INTO manuels ({', '.join(colonnes)}) VALUES ({placeholders})"
    cursor.execute(query, donnees)
    conn.commit()
    manuel_id = cursor.lastrowid
    cursor.close()
    return manuel_id

def creer_lien_liste_manuel(conn, id_liste, id_manuel):
    cursor = conn.cursor()
    query = "INSERT IGNORE INTO liste_manuels (id_liste, id_manuel) VALUES (%s, %s)"
    cursor.execute(query, (id_liste, id_manuel))
    conn.commit()
    cursor.close()

def save_extraction_positions(conn, file_id, entity_map, position_mapping):
    locations_to_insert = []
    def prepare_location(entity_type, entity_info):
        entity_id = entity_info.get('id')
        for tag in entity_info.get('source_tags', []):
            if tag in position_mapping and entity_id is not None:
                pos_data = position_mapping[tag]
                locations_to_insert.append((file_id, entity_type, entity_id, pos_data['page_info']['page_number'], json.dumps(pos_data, ensure_ascii=False)))
    if 'ecole' in entity_map: prepare_location('ecole', entity_map['ecole'])
    if 'annee' in entity_map: prepare_location('annee', entity_map['annee'])
    for niveau_id, niveau_info in entity_map.get('niveaux', {}).items():
        prepare_location('niveau', {'id': niveau_id, 'source_tags': niveau_info.get('source_tags', [])})
    for manuel_id, manuel_info in entity_map.get('manuels', {}).items():
        prepare_location('manuel', {'id': manuel_id, 'source_tags': manuel_info.get('source_tags', [])})
    if not locations_to_insert: return
    query = "INSERT INTO source_locations (source_file_id, entite_type, entite_id, page_number, coordonnees_json) VALUES (%s, %s, %s, %s, %s)"
    cursor = conn.cursor()
    try:
        cursor.executemany(query, locations_to_insert)
        conn.commit()
        print(f"  -> {len(locations_to_insert)} positions sauvegardées.")
    except Exception as e:
        print(f"    -> ERREUR lors de l'insertion des positions: {e}")
        conn.rollback()
    finally: cursor.close()

# --- DÉBUT DE LA MODIFICATION ---
def log_to_db(conn, file_id, file_name, mime_type, statut, message=""):
    """Enregistre le résultat du traitement d'un fichier dans la table de logs, incluant le mime_type."""
    cursor = conn.cursor()
    query = """
        INSERT INTO logs_fichiers (id_fichier_drive, nom_fichier, mime_type, statut, error_message, date_traitement) 
        VALUES (%s, %s, %s, %s, %s, NOW()) 
        ON DUPLICATE KEY UPDATE 
            mime_type=VALUES(mime_type), 
            statut=VALUES(statut), 
            error_message=VALUES(error_message), 
            date_traitement=NOW()
    """
    cursor.execute(query, (file_id, file_name, mime_type, statut, message[:255]))
    conn.commit()
    cursor.close()
# --- FIN DE LA MODIFICATION ---