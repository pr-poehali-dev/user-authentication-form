'''
Business: Authentication system with user registration, login, password reset
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with user data or error
'''
import json
import os
import psycopg2
import hashlib
import hmac
import base64
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_jwt(user_id: int, email: str) -> str:
    secret = os.environ.get('JWT_SECRET_KEY', 'default_secret_key')
    
    header = base64.urlsafe_b64encode(json.dumps({
        "alg": "HS256",
        "typ": "JWT"
    }).encode()).decode().rstrip('=')
    
    payload = base64.urlsafe_b64encode(json.dumps({
        "user_id": user_id,
        "email": email,
        "exp": int(time.time()) + 86400 * 7
    }).encode()).decode().rstrip('=')
    
    signature = base64.urlsafe_b64encode(
        hmac.new(
            secret.encode(),
            f"{header}.{payload}".encode(),
            hashlib.sha256
        ).digest()
    ).decode().rstrip('=')
    
    return f"{header}.{payload}.{signature}"

def verify_jwt(token: str) -> Optional[Dict[str, Any]]:
    secret = os.environ.get('JWT_SECRET_KEY', 'default_secret_key')
    
    parts = token.split('.')
    if len(parts) != 3:
        return None
    
    header, payload, signature = parts
    
    expected_signature = base64.urlsafe_b64encode(
        hmac.new(
            secret.encode(),
            f"{header}.{payload}".encode(),
            hashlib.sha256
        ).digest()
    ).decode().rstrip('=')
    
    if signature != expected_signature:
        return None
    
    padding = '=' * (4 - len(payload) % 4)
    decoded_payload = json.loads(base64.urlsafe_b64decode(payload + padding))
    
    if decoded_payload.get('exp', 0) < time.time():
        return None
    
    return decoded_payload

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    path = event.get('queryStringParameters', {}).get('action', '')
    
    if method == 'POST' and path == 'register':
        body_data = json.loads(event.get('body', '{}'))
        email = body_data.get('email', '')
        password = body_data.get('password', '')
        first_name = body_data.get('first_name', '')
        last_name = body_data.get('last_name', '')
        
        if not email or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email and password required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User already exists'})
            }
        
        password_hash = hash_password(password)
        cur.execute(
            "INSERT INTO users (email, password_hash, first_name, last_name) VALUES (%s, %s, %s, %s) RETURNING id",
            (email, password_hash, first_name, last_name)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        token = generate_jwt(user_id, email)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'token': token,
                'user': {
                    'id': user_id,
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name
                }
            })
        }
    
    if method == 'POST' and path == 'login':
        body_data = json.loads(event.get('body', '{}'))
        email = body_data.get('email', '')
        password = body_data.get('password', '')
        
        if not email or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email and password required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        password_hash = hash_password(password)
        cur.execute(
            "SELECT id, email, first_name, last_name, avatar_url FROM users WHERE email = %s AND password_hash = %s AND is_active = TRUE",
            (email, password_hash)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        token = generate_jwt(user[0], user[1])
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'token': token,
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'first_name': user[2],
                    'last_name': user[3],
                    'avatar_url': user[4]
                }
            })
        }
    
    if method == 'GET' and path == 'profile':
        auth_header = event.get('headers', {}).get('x-auth-token', '')
        
        if not auth_header:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No token provided'})
            }
        
        payload = verify_jwt(auth_header)
        if not payload:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid token'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT id, email, first_name, last_name, avatar_url, created_at FROM users WHERE id = %s",
            (payload['user_id'],)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'first_name': user[2],
                    'last_name': user[3],
                    'avatar_url': user[4],
                    'created_at': user[5].isoformat() if user[5] else None
                }
            })
        }
    
    if method == 'PUT' and path == 'profile':
        auth_header = event.get('headers', {}).get('x-auth-token', '')
        
        if not auth_header:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No token provided'})
            }
        
        payload = verify_jwt(auth_header)
        if not payload:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid token'})
            }
        
        body_data = json.loads(event.get('body', '{}'))
        first_name = body_data.get('first_name', '')
        last_name = body_data.get('last_name', '')
        avatar_url = body_data.get('avatar_url', '')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "UPDATE users SET first_name = %s, last_name = %s, avatar_url = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, email, first_name, last_name, avatar_url",
            (first_name, last_name, avatar_url, payload['user_id'])
        )
        user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'first_name': user[2],
                    'last_name': user[3],
                    'avatar_url': user[4]
                }
            })
        }
    
    if method == 'POST' and path == 'reset-password-request':
        body_data = json.loads(event.get('body', '{}'))
        email = body_data.get('email', '')
        
        if not email:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'If email exists, reset link sent'})
            }
        
        import secrets
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=1)
        
        cur.execute(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user[0], token, expires_at)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Reset link sent',
                'reset_token': token
            })
        }
    
    if method == 'POST' and path == 'reset-password':
        body_data = json.loads(event.get('body', '{}'))
        token = body_data.get('token', '')
        new_password = body_data.get('new_password', '')
        
        if not token or not new_password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Token and new password required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = %s",
            (token,)
        )
        reset_token = cur.fetchone()
        
        if not reset_token or reset_token[2] or reset_token[1] < datetime.now():
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid or expired token'})
            }
        
        password_hash = hash_password(new_password)
        cur.execute(
            "UPDATE users SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (password_hash, reset_token[0])
        )
        cur.execute(
            "UPDATE password_reset_tokens SET used = TRUE WHERE token = %s",
            (token,)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Password reset successful'})
        }
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Endpoint not found'})
    }