# Test.py
import database
import doc_processor
import ai_processor
import google_drive
import traceback
import json
from config import GOOGLE_DRIVE_FOLDER_ID

TEST_MODE = False

def main_orchestrator():
    print("--- DÉBUT DU WORKFLOW ---")
    if TEST_MODE: print("!!! MODE TEST ACTIVÉ !!!")
    else: print("!!! MODE PRODUCTION ACTIVÉ (Écriture en BDD) !!!")

    print("\n[Étape 1] Authentification et initialisation...")
    drive_service = google_drive.get_drive_service()
    if not drive_service: print("Échec authentification Google Drive. Arrêt."); return
        
    db_conn = None
    try:
        db_conn = database.get_connection()
        cache = {}
        
        print("\n[Étape 2] Récupération et filtrage des fichiers...")
        fichiers_deja_traites = database.get_fichiers_traites(db_conn)
        tous_les_fichiers_drive = google_drive.lister_fichiers_recursif(drive_service, GOOGLE_DRIVE_FOLDER_ID)
        fichiers_a_traiter = [f for f in tous_les_fichiers_drive if f['id'] not in fichiers_deja_traites]
        
        if not fichiers_a_traiter: print("\n-> Aucun nouveau fichier à traiter."); return
            
        print(f"\n[Étape 3] Lancement du traitement pour {len(fichiers_a_traiter)} nouveau(x) fichier(s)...")
        for fichier in fichiers_a_traiter:
            print(f"\n--- Traitement du fichier: {fichier['name']} ---")
            log_status, log_message = 'ERREUR_INCONNUE', ''
            try:
                succes, message, doc_obj = doc_processor.run_workflow_for_single_file(drive_service, fichier)
                if not succes: log_status, log_message = 'ERREUR_OCR', message; continue
                    
                tagged_text, position_mapping = doc_processor.preprocess_document_for_ia(doc_obj)
                if not tagged_text.strip(): log_status, log_message = 'ERREUR_OCR', "Document vide."; continue
                    
                print("  -> Lancement de l'analyse par l'IA (Gemini Pro)...")
                donnees_a_inserer = ai_processor.generer_json_pour_insertion_avec_positions(db_conn, fichier, tagged_text)
                
                total_manuels = sum(len(n.get('manuels', [])) for n in donnees_a_inserer.get('niveaux', []))
                
                if total_manuels == 0:
                    log_status, log_message = 'ERREUR_EXTRACTION', "Aucun manuel n'a été extrait par l'IA."
                    print(f"  -> ERREUR: {log_message}")
                    continue # Le finally s'occupera du log
                    
                if TEST_MODE: print("  -> RÉSULTAT (MODE TEST) :", json.dumps(donnees_a_inserer, indent=2, ensure_ascii=False)); continue
                
                print("  -> Insertion des données en base...")
                entity_map = {"niveaux": {}, "manuels": {}}
                
                id_ecole = database.get_or_create_entity_id(db_conn, cache, donnees_a_inserer['ecole']['nom_standardise'], 'ecoles', 'nom_ecole')
                entity_map['ecole'] = {'id': id_ecole, 'source_tags': donnees_a_inserer['ecole'].get('source_tags', [])}
                
                id_annee = database.get_or_create_entity_id(db_conn, cache, donnees_a_inserer['annee_scolaire']['annee_standardisee'], 'annees_scolaires', 'annee_scolaire')
                entity_map['annee'] = {'id': id_annee, 'source_tags': donnees_a_inserer['annee_scolaire'].get('source_tags', [])}

                manuels_inseres_count = 0
                for niveau_data in donnees_a_inserer.get('niveaux', []):
                    nom_std = niveau_data.get('nom_standardise')
                    tags_niveau = niveau_data.get('niveau_source_tags', [])
                    id_niveau = database.get_or_create_entity_id(db_conn, cache, nom_std, 'niveaux', 'nom_niveau')
                    entity_map['niveaux'][id_niveau] = {'source_tags': tags_niveau}
                    
                    if not all([id_ecole, id_annee, id_niveau]): print(f"  -> AVERTISSEMENT: Infos manquantes pour le niveau {nom_std}."); continue
                        
                    id_liste = database.get_or_create_liste_id(db_conn, id_ecole, id_annee, id_niveau, fichier['id'])
                    
                    for manuel_data in niveau_data.get('manuels', []):
                        if manuel_data.get('titre_livre'):
                            id_manuel = database.inserer_manuel(db_conn, manuel_data, id_niveau)
                            entity_map['manuels'][id_manuel] = {'source_tags': manuel_data.get('source_tags', [])}
                            database.creer_lien_liste_manuel(db_conn, id_liste, id_manuel)
                            manuels_inseres_count += 1
                        else:
                            print(f"  -> AVERTISSEMENT: Manuel sans titre ignoré. Tags: {manuel_data.get('source_tags')}")
                        
                print("  -> Sauvegarde des positions...")
                database.save_extraction_positions(db_conn, fichier['id'], entity_map, position_mapping)
                
                log_status, log_message = 'TRAITÉ', f"{manuels_inseres_count} manuel(s) inséré(s)."
                print(f"  -> SUCCÈS: {log_message}")
                
            except Exception as e:
                log_message = f"Erreur inattendue: {str(e)}"
                print(f"   -> ERREUR GLOBALE sur le fichier: {e}"); traceback.print_exc()
            finally:
                 if not TEST_MODE:
                    # --- DÉBUT DE LA MODIFICATION ---
                    # On récupère le mime_type de l'objet fichier pour l'envoyer à la fonction de log
                    mime_type = fichier.get('mimeType', None)
                    database.log_to_db(db_conn, fichier['id'], fichier['name'], mime_type, log_status, log_message)
                    # --- FIN DE LA MODIFICATION ---
    except Exception as e:
        print(f"\n!!! ERREUR FATALE DANS L'ORCHESTRATEUR: {e} !!!"); traceback.print_exc()
    finally:
        if db_conn and db_conn.is_connected(): db_conn.close(); print("\nConnexion BDD fermée.")
        print("--- FIN DU WORKFLOW ---")

if __name__ == "__main__":
    main_orchestrator()