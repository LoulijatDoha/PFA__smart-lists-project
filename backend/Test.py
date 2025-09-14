# main.py (ou Test.py)
import database
import doc_processor
import ai_processor
import google_drive
import traceback
import json
from config import GOOGLE_DRIVE_FOLDER_ID
from types import SimpleNamespace # N'oubliez pas cet import

TEST_MODE = False

def main_orchestrator():
    print("--- STARTING WORKFLOW ---")
    if TEST_MODE: print("!!! TEST MODE ACTIVATED !!!")
    else: print("!!! PRODUCTION MODE ACTIVATED (Writing to DB) !!!")

    print("\n[Step 1] Authentication and initialization...")
    drive_service = google_drive.get_drive_service()
    if not drive_service: print("Google Drive authentication failed. Stopping."); return
        
    db_conn = None
    try:
        db_conn = database.get_connection()
        cache = {}
        
        print("\n[Step 2] Retrieving and filtering files...")
        fichiers_deja_traites = database.get_fichiers_traites(db_conn)
        tous_les_fichiers_drive = google_drive.lister_fichiers_recursif(drive_service, GOOGLE_DRIVE_FOLDER_ID)
        fichiers_a_traiter = [f for f in tous_les_fichiers_drive if f['id'] not in fichiers_deja_traites]
        
        if not fichiers_a_traiter: print("\n-> No new files to process."); return
            
        print(f"\n[Step 3] Starting processing for {len(fichiers_a_traiter)} new file(s)...")
        for fichier in fichiers_a_traiter:
            print(f"\n--- Processing file: {fichier['name']} ({fichier['id']}) ---")
            log_status, log_message = 'ERREUR_INCONNUE', ''
            try:
                succes, message, doc_obj = doc_processor.run_workflow_for_single_file(drive_service, fichier)
                if not succes: 
                    log_status, log_message = 'ERREUR_OCR', message
                    continue
                
                donnees_agregees = {
                    "ecole": {"nom_standardise": None, "source_tags": []},
                    "annee_scolaire": {"annee_standardisee": None, "source_tags": []},
                    "niveaux_map": {}
                }
                position_mapping_complet = {}
                
                print(f"  -> Starting page-by-page analysis for {len(doc_obj.pages)} page(s)...")

                for page_num, page_obj in enumerate(doc_obj.pages, 1):
                    print(f"    -> Analyzing page {page_num}/{len(doc_obj.pages)}...")
                    
                    # --- DÉBUT DE LA CORRECTION FINALE ---
                    # Nous créons un objet qui imite le document original.
                    # Il ne contient qu'une seule page, mais la référence de texte
                    # doit être le texte COMPLET du document original pour que les
                    # "text_anchors" de la page fonctionnent.
                    page_doc_obj = SimpleNamespace(
                        pages=[page_obj],
                        text=doc_obj.text  # <- Utiliser le texte du document complet
                    )
                    
                    tagged_text_page, position_mapping_page = doc_processor.preprocess_document_for_ia(page_doc_obj)
                    # --- FIN DE LA CORRECTION FINALE ---

                    if not tagged_text_page.strip():
                        print(f"    -> Page {page_num} is empty, skipping.")
                        continue

                    position_mapping_complet.update(position_mapping_page)
                    
                    print(f"    -> Launching AI analysis for page {page_num}...")
                    donnees_page = ai_processor.generer_json_pour_insertion_avec_positions(db_conn, fichier, tagged_text_page)

                    if not donnees_agregees['ecole']['nom_standardise'] and donnees_page.get('ecole', {}).get('nom_standardise'):
                        donnees_agregees['ecole'] = donnees_page['ecole']
                    
                    if not donnees_agregees['annee_scolaire']['annee_standardisee'] and donnees_page.get('annee_scolaire', {}).get('annee_standardisee'):
                        donnees_agregees['annee_scolaire'] = donnees_page['annee_scolaire']

                    for niveau_page in donnees_page.get('niveaux', []):
                        nom_std = niveau_page.get('nom_standardise')
                        if not nom_std: continue
                        
                        if nom_std not in donnees_agregees['niveaux_map']:
                            donnees_agregees['niveaux_map'][nom_std] = {
                                "nom_brut": niveau_page.get('nom_brut'),
                                "nom_standardise": nom_std,
                                "niveau_source_tags": [],
                                "manuels": []
                            }
                        
                        donnees_agregees['niveaux_map'][nom_std]['manuels'].extend(niveau_page.get('manuels', []))
                        donnees_agregees['niveaux_map'][nom_std]['niveau_source_tags'].extend(niveau_page.get('niveau_source_tags', []))

                donnees_a_inserer = {
                    "ecole": donnees_agregees['ecole'],
                    "annee_scolaire": donnees_agregees['annee_scolaire'],
                    "niveaux": list(donnees_agregees['niveaux_map'].values())
                }
                
                print("  -> Aggregation of all pages complete.")
                
                total_manuels = sum(len(n.get('manuels', [])) for n in donnees_a_inserer.get('niveaux', []))
                
                if total_manuels == 0:
                    log_status, log_message = 'ERREUR_EXTRACTION', "No textbooks were extracted by the AI from any page."
                    print(f"  -> ERROR: {log_message}")
                    continue
                    
                if TEST_MODE: 
                    print("  -> RESULT (TEST MODE):", json.dumps(donnees_a_inserer, indent=2, ensure_ascii=False))
                    continue
                
                print("  -> Inserting aggregated data into the database...")
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
                    
                    if not all([id_ecole, id_annee, id_niveau]): 
                        print(f"  -> WARNING: Missing info for level {nom_std}. Skipping list creation."); 
                        continue
                        
                    id_liste = database.get_or_create_liste_id(db_conn, id_ecole, id_annee, id_niveau, fichier['id'])
                    
                    for manuel_data in niveau_data.get('manuels', []):
                        if manuel_data.get('titre_livre'):
                            id_manuel = database.inserer_manuel(db_conn, manuel_data, id_niveau)
                            entity_map['manuels'][id_manuel] = {'source_tags': manuel_data.get('source_tags', [])}
                            database.creer_lien_liste_manuel(db_conn, id_liste, id_manuel)
                            manuels_inseres_count += 1
                        else:
                            print(f"  -> WARNING: Textbook without a title ignored. Tags: {manuel_data.get('source_tags')}")
                        
                print("  -> Saving positions from all pages...")
                database.save_extraction_positions(db_conn, fichier['id'], entity_map, position_mapping_complet)
                
                log_status, log_message = 'TRAITÉ', f"{manuels_inseres_count} textbook(s) inserted from {len(doc_obj.pages)} pages."
                print(f"  -> SUCCESS: {log_message}")
                
            except Exception as e:
                log_message = f"Unexpected error: {str(e)}"
                print(f"   -> GLOBAL ERROR on file: {e}"); traceback.print_exc()
            finally:
                 if not TEST_MODE:
                    mime_type = fichier.get('mimeType', None)
                    database.log_to_db(db_conn, fichier['id'], fichier['name'], mime_type, log_status, log_message)
    except Exception as e:
        print(f"\n!!! FATAL ERROR IN ORCHESTRATOR: {e} !!!"); traceback.print_exc()
    finally:
        if db_conn and db_conn.is_connected(): db_conn.close(); print("\nDB connection closed.")
        print("--- WORKFLOW FINISHED ---")

if __name__ == "__main__":
    main_orchestrator()