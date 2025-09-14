# ai_processor.py
import json
import requests
import time
import database
import re
from config import GEMINI_API_KEY

if not GEMINI_API_KEY: raise ValueError("The GEMINI_API_KEY environment variable is missing.")

# --- Utility Functions and Prompts ---
def clean_niveau_brut(text: str) -> str:
    if not isinstance(text, str): return ""
    text = re.sub(r'\d{4}[-/]\d{4}', '', text)
    words_to_remove = ['manuels', 'fournitures', 'liste', 'des', 'pour', 'la', 'classe', 'de', 'et', 'list', 'of', 'supplies', 'for', 'the', 'class']
    regex = r'\b(' + '|'.join(words_to_remove) + r')\b'
    text = re.sub(regex, '', text, flags=re.IGNORECASE)
    return re.sub(r'[\s:-]+', ' ', text).strip()

def call_gemini(instructions, text_to_analyze, model="gemini-1.5-pro", retries=3, delay=5):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
    payload = {"contents": [{"parts": [{"text": f"{instructions}\n\n--- TEXT TO ANALYZE ---\n\n{text_to_analyze}"}]}], "generationConfig": {"responseMimeType": "application/json"}}
    for attempt in range(retries):
        try:
            response = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=180)
            response.raise_for_status()
            response_text = response.json()['candidates'][0]['content']['parts'][0]['text']
            start = response_text.find(next(filter(lambda c: c in '[{', response_text), ''))
            end = response_text.rfind(']' if response_text[start] == '[' else '}') + 1
            return json.loads(response_text[start:end])
        except (requests.exceptions.RequestException, KeyError, json.JSONDecodeError, IndexError, StopIteration) as e:
            print(f"    -> WARNING: Gemini call failed (attempt {attempt + 1}/{retries}): {e}")
            if attempt < retries - 1: time.sleep(delay * (attempt + 1))
    return None

def _standardise_entite(conn, valeur_brute: str, entity_type: str, knowledge_base: list, standard_choices: list):
    if not valeur_brute or not isinstance(valeur_brute, str): return None
    valeur_nettoyee = clean_niveau_brut(valeur_brute) if entity_type == 'niveaux' else valeur_brute
    if entity_type == 'niveaux': print(f"     -> Cleaning grade level: '{valeur_brute}' -> '{valeur_nettoyee}'")
    valeur_propre = ' '.join(valeur_nettoyee.lower().strip().split())
    if not valeur_propre: return valeur_brute
    for entry in knowledge_base:
        if entry['valeur_brute'] == valeur_propre:
            print(f"     -> Direct match for '{valeur_propre}': '{entry['nom_standardise']}'")
            return entry['nom_standardise']
    print(f"     -> No direct match for '{valeur_propre}'. Calling AI...")
    text_for_ai = (f"KNOWLEDGE BASE:\n{json.dumps(knowledge_base, indent=2, ensure_ascii=False)}\n\nALLOWED CHOICES LIST:\n{json.dumps(standard_choices, ensure_ascii=False)}\n\nNEW RAW TERM:\n\"{valeur_propre}\"")
    ai_result = call_gemini(intelligent_standardize_prompt_constrained, text_for_ai)
    ai_choice = ai_result.get('nom_standardise') if ai_result else None
    if ai_choice and ai_choice in standard_choices:
        print(f"     -> Gemini Pro deduced: '{ai_choice}'")
        database.learn_new_standardisation(conn, valeur_brute, ai_choice, entity_type)
        return ai_choice
    else:
        print(f"     -> Gemini Pro could not deduce. Using raw value.")
        database.learn_new_standardisation(conn, valeur_brute, valeur_brute, entity_type)
        return valeur_brute

# --- PROMPTS (Translated to English) ---
school_prompt_instructions = """
You are a document header analysis expert. Your mission is to find the name of the school.

YOUR PROCESS:
1.  Prioritize the TOP of the document. The school name is almost always in the first few lines.
2.  Look for contextual keywords like "Groupe Scolaire", "Lycée", "École", "Collège", "Institut", "Institution".
3.  Extract the full, clean name.
4.  Each input line is prefixed with a tag like [E1]. You MUST include these tags in your response.

REQUIRED JSON OUTPUT FORMAT:
- If a name is found: `{"ecole_unifie": "The Found School Name", "source_tags": ["E1", "E2"]}`
- If no clear name is found: `{"ecole_unifie": null, "source_tags": []}`
"""
year_prompt_instructions = """
You are a data correction expert. Your mission is to find and validate the school year.

YOUR PROCESS:
1.  Look for a sequence like AAAA/BBBB or AAAA-BBBB, or phrases like "Rentrée 2025".
2.  Each input line is prefixed with a tag like [E1]. You MUST include these tags in your response.

REQUIRED JSON OUTPUT FORMAT:
- If a year is found: `{"annee_scolaire": "2025/2026", "source_tags": ["E5"]}`
- If no year is found: `{"annee_scolaire": "Année Non Spécifiée ", "source_tags": []}"""

intelligent_standardize_prompt_constrained = """MISSION: For a NEW RAW TERM, find the best match in the ALLOWED CHOICES LIST, using the KNOWLEDGE BASE as a reference. Your answer MUST be one of the exact values from the LIST. FORMAT: {"nom_standardise": "EXACT_CHOICE"} or {"nom_standardise": null}"""

extract_levels_and_books_prompt = """You are an expert in analyzing school supply lists, specializing in structured data extraction.
MISSION: Analyze the entire document to comprehensively and structurally extract ALL grade levels and the precise details of each textbook.

REASONING PROCESS:
1.  **SEGMENTATION**: Read the entire document to identify sections. Each section starts with a GRADE LEVEL TITLE (e.g., "1st grade primary", "COMMON CORE"). Subject names (`French`) are NOT grade level titles.

2.  **EXTRACTION BY SECTION**: For each grade level section you have identified, go through it line by line to extract every book, textbook, or workbook. For each item found, rigorously apply the checklist below. IGNORE general supplies (pens, blank notebooks) and vague titles ("a novel of your choice").

    **2.1. EXTRACTION CHECKLIST FOR EACH BOOK:**
    -   `matiere_livre`: Identify the subject for EACH book (French, English, Maths, التربية الإسلامية, اللغة العربية). If not specified, deduce it from the title or the section's context.
    -   `titre_livre`: The full, clean title. **Arabic Example:** for "الممتاز في التربية الإسلامية ( كتاب التلميذ )", the title is "الممتاز في التربية الإسلامية". Remove mentions like "(student book)", "2021 edition", "طبعة جديدة", etc., from the title.
    -   `maison_edition`: The publisher (e.g., "Istra", "Hachette", "المعارف الجديدة"). If absent, return `null`.
    -   `annee_edition`: The 4-digit publication year if you find it (e.g., "édition 2021" -> 2021, "طبعة 2022" -> 2022). If absent, return `null`.
    -   `code_livre`: The 10 or 13-digit ISBN if present. Otherwise, return `null`.
    -   `type_livre`: Deduce the type from keywords: "Manuel" (Textbook), "Cahier d'activités" (Activity Book), "Cahier de travaux pratiques" (Workbook), "Fichier" (File), "Roman" (Novel), "Dictionnaire" (Dictionary). If no keyword is present, consider it a "Manuel" (Textbook).

3.  **HANDLING SIMPLE DOCUMENTS**: If you find only one grade level title in the entire document, then all the books in the document belong to that single grade level.

OUTPUT RULES:
-   The output format MUST be a valid JSON containing a single key "niveaux".
-   "niveaux" must be a LIST of objects.
-   Each object in the list represents a grade level and must contain: `niveau_brut`, `niveau_source_tags`, and a `manuels` list.
-   Each book in `manuels` must contain ALL the following keys: `titre_livre` (which must not be null), `matiere_livre`, `maison_edition`, `annee_edition`, `code_livre`, `type_livre`, and `source_tags`.

UPDATED OUTPUT EXAMPLE:
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


# --- MAIN FUNCTION ---
def generer_json_pour_insertion_avec_positions(conn, file_info, tagged_text: str):
    print("  -> Retrieving knowledge bases...")
    niveaux_knowledge_base = database.get_standardisation_knowledge_base(conn, 'niveaux')
    ecoles_knowledge_base = database.get_standardisation_knowledge_base(conn, 'ecoles')
    standard_niveaux_choices = sorted(list(set(item['nom_standardise'] for item in niveaux_knowledge_base)))
    standard_ecoles_choices = sorted(list(set(item['nom_standardise'] for item in ecoles_knowledge_base)))
    
    school_data = call_gemini(school_prompt_instructions, tagged_text) or {}
    year_data = call_gemini(year_prompt_instructions, tagged_text) or {}
    
    print("  -> Starting integrated extraction (levels and textbooks)...")
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
        print("    -> WARNING: Integrated extraction found no levels or textbooks.")
        return final_json

    for niveau_data in extracted_levels:
        niveau_brut = niveau_data.get("niveau_brut")
        if not niveau_brut: continue

        print(f"  -> Processing found level: '{niveau_brut}'...")
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