from json import loads
from re import I, compile, IGNORECASE, escape
from io import BytesIO
from django.http import JsonResponse
from bson.objectid import ObjectId
from datetime import datetime, time, timedelta
from django.http import HttpResponse
from pprint import PrettyPrinter
from traceback import format_exc
from rest_framework.decorators import APIView
from rest_framework.response import Response
import json
from functools import reduce
import operator
from zerasBurgerBackend.mongoConnection import db
from CustomerApp.utils import (
    validate_email, 
    validate_password, 
    validate_name,
    hash_password,
    generate_jwt_token,
    verify_password
)
dbconn = db



class RegisterUser(APIView):
    """
    Author:  `muhammed hashim m`
    Created on: 23-10-2025
    User Registration API - Creates new user with validation
    
    Body:
        name: string (required)
        email: string (required)
        password: string (required)
        confirm_password: string (required)
    
    Return:
        statusCode: int
        message: string
        data: object (user details and token)
    """
    
    def post(self, req):
        try:
            data = loads(req.body)
            
            required_fields = ['name', 'email', 'password', 'confirm_password']
            for field in required_fields:
                if field not in data or data[field] in ['', None]:
                    return JsonResponse({
                        'statusCode': 400,
                        'message': f'Bad request, {field} not found'
                    })
            
            name = data.get('name', '').strip()
            email = data.get('email', '').strip()
            password = data.get('password', '')
            confirm_password = data.get('confirm_password', '')
            
            # Validate name (first letter capital)
            is_valid_name, formatted_name, name_message = validate_name(name)
            if not is_valid_name:
                return JsonResponse({
                    'statusCode': 400,
                    'message': name_message
                })
            
            # Validate email using regex
            is_valid_email, email_message = validate_email(email)
            if not is_valid_email:
                return JsonResponse({
                    'statusCode': 400,
                    'message': email_message
                })
            
            existing_user = dbconn.clnUsers.find_one({'email': email.lower()})
            if existing_user:
                return JsonResponse({
                    'statusCode': 400,
                    'message': 'Email already registered'
                })

            is_valid_password, password_message = validate_password(password, confirm_password)
            if not is_valid_password:
                return JsonResponse({
                    'statusCode': 400,
                    'message': password_message
                })
            
            user_count = dbconn.clnUsers.count_documents({})
            role = 'admin' if user_count == 0 else 'user'
            
            # Hash password
            hashed_password = hash_password(password)
            
            # Create user document
            doc = {
                'name': formatted_name,
                'email': email.lower(),
                'password': hashed_password,
                'role': role,
                'createdOn': datetime.utcnow(),
                'activeFlag': True,
                'isInactive': False
            }
            
            # Insert into database
            result = dbconn.clnUsers.insert_one(doc)
            user_id = result.inserted_id
            
            # Generate JWT token
            token = generate_jwt_token(user_id, email.lower(), role)
            
            user_data = {
                '_id': str(user_id),
                'name': formatted_name,
                'email': email.lower(),
                'role': role,
                'createdOn': doc['createdOn'].isoformat()
            }
            
            return JsonResponse({
                'statusCode': 200,
                'message': 'Registration successful',
                'data': {
                    'user': user_data,
                    'token': token
                }
            })
            
        except Exception:
            error = format_exc()
            return JsonResponse({
                'statusCode': 500,
                'message': 'An error occurred',
                'error': str(error)
            })
        
class LoginUser(APIView):
    """
    Author: Your Name
    Created on: Date
    User Login API - Authenticates user with email and password
    
    Body:
        email: string (required)
        password: string (required)
    
    Return:
        statusCode: int
        message: string
        data: object (user details and token)
    """
    
    def post(self, req):
        try:
            data = loads(req.body)
            
            # Check required fields
            required_fields = ['email', 'password']
            for field in required_fields:
                if field not in data or data[field] in ['', None]:
                    return JsonResponse({
                        'statusCode': 400,
                        'message': f'Bad request, {field} not found'
                    })
            
            email = data.get('email', '').strip()
            password = data.get('password', '')
            
            # Validate email format
            is_valid_email, email_message = validate_email(email)
            if not is_valid_email:
                return JsonResponse({
                    'statusCode': 400,
                    'message': email_message
                })
            
            # Find user by email
            user = dbconn.clnUsers.find_one({'email': email.lower()})
            
            if not user:
                return JsonResponse({
                    'statusCode': 401,
                    'message': 'Invalid email or password'
                })
            
            # Check if account is active
            if user.get('isInactive', False) or not user.get('activeFlag', True):
                return JsonResponse({
                    'statusCode': 403,
                    'message': 'Account is inactive'
                })
            
            # Verify password
            if not verify_password(password, user['password']):
                return JsonResponse({
                    'statusCode': 401,
                    'message': 'Invalid email or password'
                })
            
            # Generate JWT token
            token = generate_jwt_token(user['_id'], user['email'], user['role'])
            
            # Prepare response data (without password)
            user_data = {
                '_id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'createdOn': user['createdOn'].isoformat()
            }
            
            return JsonResponse({
                'statusCode': 200,
                'message': 'Login successful',
                'data': {
                    'user': user_data,
                    'token': token
                }
            })
            
        except Exception:
            error = format_exc()
            return JsonResponse({
                'statusCode': 500,
                'message': 'An error occurred',
                'error': str(error)
            })

