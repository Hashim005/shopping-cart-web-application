import re
import jwt
import bcrypt
from datetime import datetime, timedelta
import os
from functools import wraps
from django.http import JsonResponse
from zerasBurgerBackend.mongoConnection import db
from bson.objectid import ObjectId
dbconn = db

EMAIL_REGEX = re.compile(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
)


def validate_email(email):
    """Validate email format using regex"""
    if not email:
        return False, "Email is required"
    
    if not EMAIL_REGEX.match(email):
        return False, "Invalid email format"
    
    return True, "Valid email"


def validate_password(password, confirm_password):
    """Validate password and confirm password match"""
    if not password:
        return False, "Password is required"
    
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    
    if password != confirm_password:
        return False, "Passwords do not match"
    
    return True, "Valid password"


def validate_name(name):
    """Validate and format name (first letter capital)"""
    if not name:
        return False, None, "Name is required"
    
    # Remove extra spaces and capitalize first letter of each word
    formatted_name = ' '.join(word.capitalize() for word in name.strip().split())
    
    if len(formatted_name) < 2:
        return False, None, "Name must be at least 2 characters long"
    
    return True, formatted_name, "Valid name"


def hash_password(password):
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password, hashed_password):
    """Verify password against hashed password"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


def generate_jwt_token(user_id, email, role):
    """Generate JWT token"""
    jwt_secret = os.getenv('JWT_SECRET_KEY', 'a560237226dc146102e735671313dd863adff7e3e4ba8404db0428891c027065')
    jwt_algorithm = os.getenv('JWT_ALGORITHM', 'HS256')
    expiration_hours = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    
    payload = {
        'user_id': str(user_id),
        'email': email,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=expiration_hours),
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(payload, jwt_secret, algorithm=jwt_algorithm)
    return token


def decode_jwt_token(token):
    """Decode and verify JWT token"""
    try:
        jwt_secret = os.getenv('JWT_SECRET_KEY', 'a560237226dc146102e735671313dd863adff7e3e4ba8404db0428891c027065')
        jwt_algorithm = os.getenv('JWT_ALGORITHM', 'HS256')
        
        payload = jwt.decode(token, jwt_secret, algorithms=[jwt_algorithm])
        return True, payload
    except jwt.ExpiredSignatureError:
        return False, "Token has expired"
    except jwt.InvalidTokenError:
        return False, "Invalid token"


def jwt_required(view_func):
    """Decorator to protect views with JWT authentication"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'statusCode': 401,
                'message': 'No token provided'
            })
        
        token = auth_header.split(' ')[1]
        
        # Decode token
        is_valid, payload = decode_jwt_token(token)
        
        if not is_valid:
            return JsonResponse({
                'statusCode': 401,
                'message': payload
            })
        
        # Get user from database
        user = dbconn.clnUsers.find_one({'_id': ObjectId(payload['userLoginId'])})
        
        if not user:
            return JsonResponse({
                'statusCode': 401,
                'message': 'User not found'
            })
        
        # Attach user object to request
        request.userLoginObj = user
        
        return view_func(request, *args, **kwargs)
    
    return wrapper