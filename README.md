# Projet Smart Lists

Ceci est une application full-stack pour la gestion de listes scolaires.

## Structure du Projet

- `/backend`: Serveur API en Flask (Python)
- `/frontend`: Application cliente en React (Vite)

## Prérequis

- Node.js (version 20.x ou supérieure)
- Python (version 3.10 ou supérieure)
- Git

## Installation et Lancement

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/VotreNom/smart-lists-project.git
    cd smart-lists-project
    ```

2.  **Configurer le Backend :**
    ```bash
    cd backend
    python -m venv venv
    # Activer l'environnement (Windows)
    .\venv\Scripts\activate
    # Installer les dépendances
    pip install -r requirements.txt
    # Créer un fichier .env et y mettre les variables de BDD
    # Lancer le serveur
    python app.py
    ```
    Le serveur backend tournera sur `http://localhost:5000`.

3.  **Configurer le Frontend (dans un autre terminal) :**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    L'application frontend sera accessible sur `http://localhost:5173`.