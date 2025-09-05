# Prototyping/routes/users.py
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash
import database
from decorators import admin_required

users_bp = Blueprint('users_bp', __name__)

@users_bp.route('', methods=['GET'])
@login_required
@admin_required
def get_all_users():
    """
    Récupère les utilisateurs de manière paginée.
    Accepte les paramètres d'URL `page` et `limit`.
    Ex: /api/v1/users?page=2&limit=10
    """
    try:
        # 1. Récupérer les paramètres de pagination de l'URL, avec des valeurs par défaut
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        # 2. Calculer l'offset pour la requête SQL
        offset = (page - 1) * limit

        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        
        # 3. Requête pour obtenir le nombre total d'utilisateurs
        cursor.execute("SELECT COUNT(*) as total FROM users")
        total_users = cursor.fetchone()['total']
        
        # 4. Requête pour obtenir la page actuelle d'utilisateurs
        query = """
            SELECT id, username, nom_complet, email, poste, role, is_active, 
                   DATE_FORMAT(date_creation, '%Y-%m-%d') as date_creation,
                   DATE_FORMAT(last_login, '%Y-%m-%d %H:%i') as last_login
            FROM users
            ORDER BY nom_complet ASC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (limit, offset))
        users_page = cursor.fetchall()

        # 5. Renvoyer une réponse structurée avec les données et les métadonnées de pagination
        return jsonify({
            'data': users_page,
            'total_items': total_users,
            'total_pages': (total_users + limit - 1) // limit, # Formule pour calculer le nombre de pages
            'current_page': page,
        })

    except Exception as e:
        return jsonify({"error": "Erreur serveur", "details": str(e)}), 500
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

@users_bp.route('', methods=['POST'])
@admin_required
def create_user():
    data = request.json
    required = ['username', 'password', 'nom_complet', 'email', 'poste', 'role']
    if not all(field in data for field in required):
        return jsonify({"message": "Tous les champs sont requis."}), 400
    
    password_hash = generate_password_hash(data['password'])
    db_conn = database.get_connection()
    cursor = db_conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash, nom_complet, email, poste, role) VALUES (%s, %s, %s, %s, %s, %s)",
            (data['username'], password_hash, data['nom_complet'], data['email'], data['poste'], data['role'])
        )
        db_conn.commit()
        return jsonify({"message": "Utilisateur créé."}), 201
    except database.mysql.connector.IntegrityError:
        return jsonify({"message": "Nom d'utilisateur ou email déjà utilisé."}), 409
    finally:
        db_conn.close()

@users_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    # ... (code pour mettre à jour les nouveaux champs)
    data = request.json
    fields = {k: v for k, v in data.items() if k in ['username', 'nom_complet', 'email', 'poste', 'role', 'is_active']}
    
    if not fields: return jsonify({"error": "Aucun champ à mettre à jour"}), 400

    set_clause = ", ".join([f"{key} = %s" for key in fields.keys()])
    values = list(fields.values())
    values.append(user_id)

    db_conn = database.get_connection()
    cursor = db_conn.cursor()
    cursor.execute(f"UPDATE users SET {set_clause} WHERE id = %s", tuple(values))
    db_conn.commit()
    db_conn.close()
    return jsonify({"message": "Utilisateur mis à jour."})

# ROUTE DE RÉINITIALISATION AMÉLIORÉE
@users_bp.route('/<int:user_id>/reset-password', methods=['POST'])
@admin_required
def reset_password(user_id):
    data = request.json
    new_password = data.get('password')
    if not new_password:
        return jsonify({"message": "Nouveau mot de passe requis."}), 400
    
    password_hash = generate_password_hash(new_password)
    db_conn = database.get_connection()
    cursor = db_conn.cursor()
    # On met à jour le mot de passe ET on force l'utilisateur à le changer
    cursor.execute("UPDATE users SET password_hash = %s, must_change_password = TRUE WHERE id = %s", (password_hash, user_id))
    db_conn.commit()
    db_conn.close()
    return jsonify({"message": "Mot de passe réinitialisé."})


@users_bp.route('/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def deactivate_user(user_id):
    if user_id == current_user.id:
        return jsonify({"success": False, "message": "Vous ne pouvez pas désactiver votre propre compte."}), 403
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()
        cursor.execute("UPDATE users SET is_active = FALSE WHERE id = %s", (user_id,))
        db_conn.commit()
        return jsonify({"success": True, "message": f"Utilisateur {user_id} désactivé."})
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()