# standardizer.py (Version Finale avec Matching Contextualisé)
import json
import ai_processor
import database

# Cache en mémoire pour l'exécution actuelle afin d'éviter les appels BDD répétés
standardisation_cache = {
    "niveaux": {},
    "ecoles": {}
}

def standardise_value_intelligent(conn, valeur_brute: str, entity_type: str):
    """
    Standardise une valeur en utilisant un cache, la BDD, et une IA contextualisée
    qui choisit parmi une liste de valeurs standard existantes.
    'entity_type' doit être le nom de la table principale (ex: 'ecoles', 'niveaux').
    """
    # On normalise la valeur brute pour l'utiliser comme clé
    valeur_propre = ' '.join(str(valeur_brute or '').lower().strip().split())
    if not valeur_propre:
        return valeur_brute

    # 1. Vérifier le cache en mémoire pour cette exécution
    if valeur_propre in standardisation_cache.get(entity_type, {}):
        return standardisation_cache[entity_type][valeur_propre]
        
    cursor = conn.cursor(dictionary=True)
    try:
        table_name_std = f"standardisation_{entity_type}"
        column_name_std = "nom_standardise"
        
        # 2. Chercher une correspondance exacte dans la table de standardisation
        query = f"SELECT {column_name_std} FROM {table_name_std} WHERE valeur_brute = %s AND statut != 'REJETÉ'"
        cursor.execute(query, (valeur_propre,))
        result = cursor.fetchone()
        if result:
            standard_value = result[column_name_std].strip()
            standardisation_cache.setdefault(entity_type, {})[valeur_propre] = standard_value
            return standard_value

        # 3. Échec -> Utiliser l'IA pour le matching intelligent
        print(f"    -> Standardisation IA avancée pour '{entity_type}': '{valeur_brute}'")
        
        # On récupère la liste des choix valides depuis la table principale (ex: 'ecoles')
        choix_possibles = database.get_standard_choices(conn, entity_type)
        if not choix_possibles:
            print(f"       -> AVERTISSEMENT: La table '{entity_type}' est vide. Impossible de standardiser. Utilisation de la valeur brute.")
            return valeur_brute.strip()

        # Construction du prompt contextualisé pour l'IA
        context_prompt = (
            f"Ta mission est de trouver la correspondance la plus logique entre une \"Valeur brute\" et une liste de \"Choix possibles\".\n"
            f"Tu dois retourner la valeur EXACTE choisie dans la liste.\n\n"
            f"Valeur brute: \"{valeur_brute}\"\n\n"
            f"Choix possibles:\n- " + "\n- ".join(choix_possibles) + "\n\n"
            f"Si aucune correspondance n'est évidente, retourne la valeur brute originale telle quelle.\n"
            f"Ta sortie DOIT être un objet JSON avec une seule clé \"nom_nettoye\"."
        )
        
        suggestion = valeur_brute.strip()
        try:
            # On utilise le prompt contextualisé pour guider l'IA
            matching_data, _ = ai_processor.call_gemini(
                instructions="", # Le contexte est tout le prompt
                text_to_analyze=context_prompt,
                model="gemini-1.5-flash"
            )
            suggestion_ia = matching_data.get("nom_nettoye", suggestion)
            
            # Sécurité : si l'IA retourne une valeur qui n'est pas dans la liste, c'est suspect
            if suggestion_ia in choix_possibles:
                suggestion = suggestion_ia
            else:
                 print(f"       -> AVERTISSEMENT: L'IA a suggéré une valeur non standard ('{suggestion_ia}'). Conservation de la valeur brute.")

        except Exception as e:
            print(f"       -> AVERTISSEMENT: L'IA de matching a échoué : {e}")
        
        # 4. Enregistrer ce nouveau mapping pour validation humaine
        print(f"       -> Suggestion de l'IA: '{valeur_brute}' -> '{suggestion}'")
        insert_query = f"INSERT INTO {table_name_std} (valeur_brute, {column_name_std}, statut, score_confiance) VALUES (%s, %s, 'À_VÉRIFIER', 0.85)"
        cursor.execute(insert_query, (valeur_propre, suggestion))
        conn.commit()
        
        standardisation_cache.setdefault(entity_type, {})[valeur_propre] = suggestion
        return suggestion

    except Exception as e:
        print(f"    -> ERREUR: Échec critique de la standardisation pour '{valeur_brute}'. Erreur: {e}")
        return valeur_brute.strip()
    finally:
        if cursor:
            cursor.close()

MANUAL_CLEANING_PROMPT = """
Tu es un expert bibliothécaire. Ta mission est de nettoyer les informations DÉJÀ EXTRAITES d'un manuel.
RÈGLES SIMPLES :
1.  `titre_std`: Prends le titre fourni et supprime UNIQUEMENT les mentions de niveau ou de numéro (ex: "4", "CE2", "1ère année"). Ne touche à rien d'autre.
2.  `editeur_std`: Simplifie le nom de l'éditeur (ex: "Hachette éducation" -> "Hachette").
3.  `annee_std`: Isole l'année d'édition à 4 chiffres.
EXEMPLE :
- Entrée: {"titre_livre": "Bubbles 4"}
- Sortie: {"titre_std": "Bubbles", "editeur_std": null, "annee_std": null}
Retourne UNIQUEMENT l'objet JSON final.
"""

def standardise_manuel(manuel_brut: dict) -> dict:
    """Nettoie les champs d'un dictionnaire de manuel."""
    titre_original_brut = str(manuel_brut.get('titre_livre') or '').strip()
    try:
        standardised_data, _ = ai_processor.call_gemini(
            instructions=MANUAL_CLEANING_PROMPT,
            text_to_analyze=json.dumps(manuel_brut, ensure_ascii=False),
            model="gemini-1.5-flash", # Flash est suffisant pour cette tâche simple
            is_json=True
        )
        titre_final_std = standardised_data.get('titre_std') or titre_original_brut
        editeur_final = standardised_data.get('editeur_std') or manuel_brut.get('maison_edition')
        annee_final = standardised_data.get('annee_std') or manuel_brut.get('annee_edition')
    except Exception as e:
        print(f"       -> AVERTISSEMENT: La standardisation IA du manuel a échoué : {e}. Utilisation des valeurs brutes.")
        titre_final_std = titre_original_brut
        editeur_final = manuel_brut.get('maison_edition')
        annee_final = manuel_brut.get('annee_edition')

    return {
        'titre_brut': titre_original_brut,
        'titre': str(titre_final_std or '').strip(),
        'editeur': str(editeur_final or '').strip(),
        'annee_edition': str(annee_final or '').strip(),
        'isbn': str(manuel_brut.get('code_livre') or '').strip(),
        'type': str(manuel_brut.get('type_livre') or '').strip(),
        'matiere': str(manuel_brut.get('matiere_livre') or '').strip()
    }