# ai_processor.py
import json
import requests
import time
import database
import re
from config import GEMINI_API_KEY

if not GEMINI_API_KEY: raise ValueError("La variable d'environnement GEMINI_API_KEY est manquante.")

# --- Fonctions Utilitaires et Prompts ---
def clean_niveau_brut(text: str) -> str:
    if not isinstance(text, str): return ""
    text = re.sub(r'\d{4}[-/]\d{4}', '', text)
    words_to_remove = ['manuels', 'fournitures', 'liste', 'des', 'pour', 'la', 'classe', 'de', 'et']
    regex = r'\b(' + '|'.join(words_to_remove) + r')\b'
    text = re.sub(regex, '', text, flags=re.IGNORECASE)
    return re.sub(r'[\s:-]+', ' ', text).strip()

def call_gemini(instructions, text_to_analyze, model="gemini-1.5-pro", retries=3, delay=5):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
    payload = {"contents": [{"parts": [{"text": f"{instructions}\n\n--- TEXTE À ANALYSER ---\n\n{text_to_analyze}"}]}], "generationConfig": {"responseMimeType": "application/json"}}
    for attempt in range(retries):
        try:
            response = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=180)
            response.raise_for_status()
            response_text = response.json()['candidates'][0]['content']['parts'][0]['text']
            start = response_text.find(next(filter(lambda c: c in '[{', response_text), ''))
            end = response_text.rfind(']' if response_text[start] == '[' else '}') + 1
            return json.loads(response_text[start:end])
        except (requests.exceptions.RequestException, KeyError, json.JSONDecodeError, IndexError, StopIteration) as e:
            print(f"    -> AVERTISSEMENT: L'appel Gemini a échoué (tentative {attempt + 1}/{retries}): {e}")
            if attempt < retries - 1: time.sleep(delay * (attempt + 1))
    return None

def _standardise_entite(conn, valeur_brute: str, entity_type: str, knowledge_base: list, standard_choices: list):
    if not valeur_brute or not isinstance(valeur_brute, str): return None
    valeur_nettoyee = clean_niveau_brut(valeur_brute) if entity_type == 'niveaux' else valeur_brute
    if entity_type == 'niveaux': print(f"     -> Nettoyage du niveau : '{valeur_brute}' -> '{valeur_nettoyee}'")
    valeur_propre = ' '.join(valeur_nettoyee.lower().strip().split())
    if not valeur_propre: return valeur_brute
    for entry in knowledge_base:
        if entry['valeur_brute'] == valeur_propre:
            print(f"     -> Correspondance directe pour '{valeur_propre}': '{entry['nom_standardise']}'")
            return entry['nom_standardise']
    print(f"     -> Pas de correspondance directe pour '{valeur_propre}'. Appel de l'IA...")
    text_for_ai = (f"BASE DE CONNAISSANCES:\n{json.dumps(knowledge_base, indent=2, ensure_ascii=False)}\n\nLISTE DE CHOIX AUTORISÉS:\n{json.dumps(standard_choices, ensure_ascii=False)}\n\nNOUVEAU TERME BRUT:\n\"{valeur_propre}\"")
    ai_result = call_gemini(intelligent_standardize_prompt_constrained, text_for_ai)
    ai_choice = ai_result.get('nom_standardise') if ai_result else None
    if ai_choice and ai_choice in standard_choices:
        print(f"     -> Gemini Pro a déduit: '{ai_choice}'")
        database.learn_new_standardisation(conn, valeur_brute, ai_choice, entity_type)
        return ai_choice
    else:
        print(f"     -> Gemini Pro n'a pas pu déduire. On utilise la valeur brute.")
        database.learn_new_standardisation(conn, valeur_brute, valeur_brute, entity_type)
        return valeur_brute

# --- PROMPTS ---
school_prompt_instructions = """Trouve le nom de l'établissement scolaire. FORMAT JSON: {"ecole_unifie": "NOM", "source_tags": ["E1"]} ou {"ecole_unifie": null, "source_tags": []}"""
year_prompt_instructions = """Trouve l'année scolaire (format AAAA/BBBB). FORMAT JSON: {"annee_scolaire": "AAAA/BBBB", "source_tags": ["E5"]} ou {"annee_scolaire": null, "source_tags": []}"""
intelligent_standardize_prompt_constrained = """MISSION: Pour un NOUVEAU TERME BRUT, trouve la meilleure correspondance dans la LISTE DE CHOIX AUTORISÉS, en t'aidant de la BASE DE CONNAISSANCES. Ta réponse DOIT être une des valeurs exactes de la LISTE. FORMAT: {"nom_standardise": "CHOIX_EXACT"} ou {"nom_standardise": null}"""

extract_levels_and_books_prompt = """Tu es un expert en analyse de listes de fournitures scolaires, spécialisé dans l'extraction de données structurées.
MISSION : Analyser le document complet pour extraire de manière exhaustive et structurée TOUS les niveaux scolaires et les détails précis de chaque manuel.

PROCESSUS DE RAISONNEMENT :
1.  **SEGMENTATION** : Lis le document entier pour identifier les sections. Chaque section commence par un TITRE DE NIVEAU (ex: "1ère année primaire", "TRONC COMMUN"). Les noms de matières (`Français`) ne sont PAS des titres de niveau.

2.  **EXTRACTION PAR SECTION** : Pour chaque section de niveau que tu as identifiée, parcours-la ligne par ligne pour extraire chaque livre, manuel, ou cahier. Pour chaque élément trouvé, applique rigoureusement la checklist ci-dessous. IGNORE les fournitures générales (stylos, cahiers vierges) et les titres vagues ("un roman au choix").

    **2.1. CHECKLIST D'EXTRACTION POUR CHAQUE LIVRE :**
    -   `matiere_livre`: Identifier la matière pour CHAQUE livre (Français, Anglais, Maths, التربية الإسلامية, اللغة العربية). Si non spécifiée, déduis-la du titre ou du contexte de la section.
    -   `titre_livre`: Le titre complet et propre. **Exemple arabe :** pour "الممتاز في التربية الإسلامية ( كتاب التلميذ )", le titre est "الممتاز في التربية الإسلامية". Retire les mentions comme "(livre de l'élève)", "édition 2021", "طبعة جديدة", etc. du titre.
    -   `maison_edition`: L'éditeur (ex: "Istra", "Hachette", "المعارف الجديدة"). Si absente, retourne `null`.
    -   `annee_edition`: L'année d'édition de 4 chiffres si tu la trouves (ex: "édition 2021" -> 2021, "طبعة 2022" -> 2022). Si absente, retourne `null`.
    -   `code_livre`: L'ISBN de 10 ou 13 chiffres si présent. Sinon, retourne `null`.
    -   `type_livre`: Déduis le type à partir de mots-clés : "Manuel", "Cahier d'activités", "Cahier de travaux pratiques", "Fichier", "Roman", "Dictionnaire". Si aucun mot-clé n'est présent, considère-le comme "Manuel".

3.  **GESTION DES DOCUMENTS SIMPLES** : Si tu ne trouves qu'un seul titre de niveau dans tout le document, alors tous les livres du document appartiennent à ce niveau unique.

RÈGLES DE SORTIE :
-   Le format de sortie DOIT être un JSON valide contenant une clé unique "niveaux".
-   "niveaux" doit être une LISTE d'objets.
-   Chaque objet de la liste représente un niveau et doit contenir : `niveau_brut`, `niveau_source_tags`, et une liste `manuels`.
-   Chaque livre dans `manuels` doit contenir TOUTES les clés suivantes : `titre_livre` (qui ne doit pas être nul), `matiere_livre`, `maison_edition`, `annee_edition`, `code_livre`, `type_livre`, et `source_tags`.

EXEMPLE DE SORTIE MIS À JOUR:
{
  "niveaux": [
    {
      "niveau_brut": "3e année primaire",
      "niveau_source_tags": ["E5"],
      "manuels": [
        {
          "titre_livre": "Mot de passe",
          "matiere_livre": "Français",
          "maison_edition": "Hachette",
          "annee_edition": 2021,
          "code_livre": "9782017135111",
          "type_livre": "Manuel",
          "source_tags": ["E..."]
        },
        {
          "titre_livre": "Mes apprentissages en français",
          "matiere_livre": "Français",
          "maison_edition": null,
          "annee_edition": null,
          "code_livre": null,
          "type_livre": "Cahier d'activités",
          "source_tags": ["E..."]
        }
      ]
    },
    {
      "niveau_brut": "الجدع المشترك علمي",
      "niveau_source_tags": ["E25"],
      "manuels": [
        {
          "titre_livre": "الممتاز في التربية الإسلامية",
          "matiere_livre": "التربية الإسلامية",
          "maison_edition": "دار الثقافة",
          "annee_edition": 2022,
          "code_livre": null,
          "type_livre": "Manuel",
          "source_tags": ["E..."]
        }
      ]
    }
  ]
}
"""


# --- FONCTION PRINCIPALE ---
def generer_json_pour_insertion_avec_positions(conn, file_info, tagged_text: str):
    print("  -> Récupération des bases de connaissances...")
    niveaux_knowledge_base = database.get_standardisation_knowledge_base(conn, 'niveaux')
    ecoles_knowledge_base = database.get_standardisation_knowledge_base(conn, 'ecoles')
    standard_niveaux_choices = sorted(list(set(item['nom_standardise'] for item in niveaux_knowledge_base)))
    standard_ecoles_choices = sorted(list(set(item['nom_standardise'] for item in ecoles_knowledge_base)))
    
    school_data = call_gemini(school_prompt_instructions, tagged_text) or {}
    year_data = call_gemini(year_prompt_instructions, tagged_text) or {}
    
    print("  -> Lancement de l'extraction intégrée (niveaux et manuels)...")
    extraction_data = call_gemini(extract_levels_and_books_prompt, tagged_text)
    
    extracted_levels = extraction_data.get('niveaux') if isinstance(extraction_data, dict) else []
    
    final_json = {
        "ecole": {
            "nom_standardise": _standardise_entite(conn, school_data.get('ecole_unifie'), 'ecoles', ecoles_knowledge_base, standard_ecoles_choices),
            "source_tags": school_data.get('source_tags', [])
        },
        "annee_scolaire": {
            "annee_standardisee": year_data.get('annee_scolaire'),
            "source_tags": year_data.get('source_tags', [])
        },
        "niveaux": []
    }

    if not extracted_levels:
        print("    -> AVERTISSEMENT: L'extraction intégrée n'a trouvé aucun niveau ou manuel.")
        return final_json

    for niveau_data in extracted_levels:
        niveau_brut = niveau_data.get("niveau_brut")
        if not niveau_brut: continue

        print(f"  -> Traitement du niveau trouvé : '{niveau_brut}'...")
        nom_std_niveau = _standardise_entite(conn, niveau_brut, 'niveaux', niveaux_knowledge_base, standard_niveaux_choices)
        
        manuels_valides = [
            livre for livre in niveau_data.get("manuels", []) 
            if isinstance(livre, dict) and livre.get("titre_livre")
        ]

        final_json["niveaux"].append({
            "nom_brut": niveau_brut,
            "nom_standardise": nom_std_niveau,
            "niveau_source_tags": niveau_data.get("niveau_source_tags", []),
            "manuels": manuels_valides
        })

    return final_json