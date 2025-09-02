# Prototyping/routes/users.py
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash
import database
from decorators import admin_required

# Créer le Blueprint pour les routes de gestion des utilisateurs
users_bp = Blueprint('users_bp', __name__)

@users_bp.route('', methods=['GET'])
@login_required
@admin_required
def get_all_users():
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, role, is_active FROM users")
        users = cursor.fetchall()
        return jsonify(users)
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

@users_bp.route('', methods=['POST'])
@login_required
@admin_required
def create_user():
    data = request.json
    username, password, role = data.get('username'), data.get('password'), data.get('role', 'utilisateur')
    if not username or not password:
        return jsonify({"success": False, "message": "Nom d'utilisateur et mot de passe requis."}), 400
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({"success": False, "message": "Ce nom d'utilisateur existe déjà."}), 409
        password_hash = generate_password_hash(password)
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)", (username, password_hash, role))
        db_conn.commit()
        return jsonify({"success": True, "message": f"Utilisateur '{username}' créé."}), 201
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

@users_bp.route('/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_user(user_id):
    data = request.json
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()
        fields, values = [], []
        if 'username' in data: fields.append("username = %s"); values.append(data['username'])
        if 'password' in data and data['password']: fields.append("password_hash = %s"); values.append(generate_password_hash(data['password']))
        if 'role' in data and data['role'] in ['admin', 'validator']: fields.append("role = %s"); values.append(data['role'])
        if 'is_active' in data and isinstance(data['is_active'], bool): fields.append("is_active = %s"); values.append(data['is_active'])
        if not fields: return jsonify({"error": "Aucun champ valide à mettre à jour"}), 400
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(fields)} WHERE id = %s"
        cursor.execute(query, tuple(values))
        db_conn.commit()
        return jsonify({"success": True, "message": f"Utilisateur {user_id} mis à jour."})
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

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