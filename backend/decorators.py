# Prototyping/decorators.py
from functools import wraps
from flask import jsonify
from flask_login import current_user

def admin_required(f):
    """
    Décorateur qui restreint l'accès d'une route aux utilisateurs
    ayant le rôle 'admin'.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # On vérifie d'abord que l'utilisateur est bien authentifié
        if not current_user.is_authenticated:
            return jsonify({"message": "Authentification requise."}), 401
        
        # Ensuite, on vérifie son rôle
        if current_user.role != 'admin':
            return jsonify({"message": "Accès non autorisé. Privilèges administrateur requis."}), 403
        
        return f(*args, **kwargs)
    return decorated_function