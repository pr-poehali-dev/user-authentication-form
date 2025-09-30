'''
Business: Two-factor authentication management (enable, verify, generate codes)
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with 2FA data or verification status
'''
import json
import os
import psycopg2
import hashlib
import hmac
import base64
import time
import secrets
import string
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

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

def generate_2fa_code() -> str:
    return ''.join(secrets.choice(string.digits) for _ in range(6))

def generate_2fa_secret() -> str:
    return secrets.token_urlsafe(32)

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
    
    user_id = payload['user_id']
    
    if method == 'POST' and path == 'enable':
        conn = get_db_connection()
        cur = conn.cursor()
        
        secret = generate_2fa_secret()
        
        cur.execute(
            "UPDATE users SET two_factor_secret = %s WHERE id = %s",
            (secret, user_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': '2FA secret generated',
                'secret': secret
            })
        }
    
    if method == 'POST' and path == 'confirm':
        body_data = json.loads(event.get('body', '{}'))
        code = body_data.get('code', '')
        
        if not code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Code required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT id FROM two_factor_codes WHERE user_id = %s AND code = %s AND used = FALSE AND expires_at > NOW()",
            (user_id, code)
        )
        code_record = cur.fetchone()
        
        if not code_record:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid or expired code'})
            }
        
        cur.execute(
            "UPDATE users SET two_factor_enabled = TRUE WHERE id = %s",
            (user_id,)
        )
        cur.execute(
            "UPDATE two_factor_codes SET used = TRUE WHERE id = %s",
            (code_record[0],)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': '2FA enabled successfully'})
        }
    
    if method == 'POST' and path == 'generate-code':
        conn = get_db_connection()
        cur = conn.cursor()
        
        code = generate_2fa_code()
        expires_at = datetime.now() + timedelta(minutes=10)
        
        cur.execute(
            "INSERT INTO two_factor_codes (user_id, code, expires_at) VALUES (%s, %s, %s)",
            (user_id, code, expires_at)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'code': code,
                'expires_in_minutes': 10
            })
        }
    
    if method == 'POST' and path == 'verify':
        body_data = json.loads(event.get('body', '{}'))
        code = body_data.get('code', '')
        
        if not code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Code required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT id FROM two_factor_codes WHERE user_id = %s AND code = %s AND used = FALSE AND expires_at > NOW()",
            (user_id, code)
        )
        code_record = cur.fetchone()
        
        if not code_record:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid or expired code', 'verified': False})
            }
        
        cur.execute(
            "UPDATE two_factor_codes SET used = TRUE WHERE id = %s",
            (code_record[0],)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'verified': True, 'message': 'Code verified'})
        }
    
    if method == 'POST' and path == 'disable':
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = %s",
            (user_id,)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': '2FA disabled successfully'})
        }
    
    if method == 'GET' and path == 'status':
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT two_factor_enabled FROM users WHERE id = %s",
            (user_id,)
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
            'body': json.dumps({'two_factor_enabled': user[0]})
        }
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Endpoint not found'})
    }