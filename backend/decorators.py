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
        if not current_user.is_authenticated or current_user.role != 'admin':
            return jsonify({"success": False, "message": "Accès non autorisé. Privilèges administrateur requis."}), 403
        return f(*args, **kwargs)
    return decorated_function