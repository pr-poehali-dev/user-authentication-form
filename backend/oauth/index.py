'''
Business: OAuth authentication with Google and GitHub
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with OAuth URLs or user data
'''
import json
import os
import psycopg2
import hashlib
import hmac
import base64
import time
import urllib.parse
import urllib.request
from typing import Dict, Any, Optional

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

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

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    path = event.get('queryStringParameters', {}).get('action', '')
    provider = event.get('queryStringParameters', {}).get('provider', '')
    
    if method == 'GET' and path == 'init':
        callback_url = event.get('queryStringParameters', {}).get('callback_url', '')
        
        if provider == 'google':
            client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
            google_auth_url = (
                f"https://accounts.google.com/o/oauth2/v2/auth?"
                f"client_id={client_id}&"
                f"redirect_uri={urllib.parse.quote(callback_url)}&"
                f"response_type=code&"
                f"scope=email%20profile&"
                f"access_type=offline"
            )
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'auth_url': google_auth_url})
            }
        
        elif provider == 'github':
            client_id = os.environ.get('GITHUB_CLIENT_ID', '')
            github_auth_url = (
                f"https://github.com/login/oauth/authorize?"
                f"client_id={client_id}&"
                f"redirect_uri={urllib.parse.quote(callback_url)}&"
                f"scope=user:email"
            )
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'auth_url': github_auth_url})
            }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid provider'})
        }
    
    if method == 'POST' and path == 'callback':
        body_data = json.loads(event.get('body', '{}'))
        code = body_data.get('code', '')
        callback_url = body_data.get('callback_url', '')
        
        if not code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Code required'})
            }
        
        if provider == 'google':
            client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
            client_secret = os.environ.get('GOOGLE_CLIENT_SECRET', '')
            
            token_data = urllib.parse.urlencode({
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': callback_url,
                'grant_type': 'authorization_code'
            }).encode()
            
            token_req = urllib.request.Request(
                'https://oauth2.googleapis.com/token',
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            with urllib.request.urlopen(token_req) as response:
                token_response = json.loads(response.read().decode())
                access_token = token_response.get('access_token')
            
            user_req = urllib.request.Request(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            with urllib.request.urlopen(user_req) as response:
                user_data = json.loads(response.read().decode())
            
            oauth_id = user_data.get('id')
            email = user_data.get('email')
            first_name = user_data.get('given_name', '')
            last_name = user_data.get('family_name', '')
            avatar_url = user_data.get('picture', '')
            
        elif provider == 'github':
            client_id = os.environ.get('GITHUB_CLIENT_ID', '')
            client_secret = os.environ.get('GITHUB_CLIENT_SECRET', '')
            
            token_data = json.dumps({
                'client_id': client_id,
                'client_secret': client_secret,
                'code': code,
                'redirect_uri': callback_url
            }).encode()
            
            token_req = urllib.request.Request(
                'https://github.com/login/oauth/access_token',
                data=token_data,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            )
            
            with urllib.request.urlopen(token_req) as response:
                token_response = json.loads(response.read().decode())
                access_token = token_response.get('access_token')
            
            user_req = urllib.request.Request(
                'https://api.github.com/user',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Accept': 'application/json'
                }
            )
            
            with urllib.request.urlopen(user_req) as response:
                user_data = json.loads(response.read().decode())
            
            oauth_id = str(user_data.get('id'))
            email = user_data.get('email', f"github_{oauth_id}@oauth.local")
            name_parts = (user_data.get('name') or '').split(' ', 1)
            first_name = name_parts[0] if name_parts else user_data.get('login', '')
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            avatar_url = user_data.get('avatar_url', '')
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid provider'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT id, email, first_name, last_name, avatar_url FROM users WHERE oauth_provider = %s AND oauth_id = %s",
            (provider, oauth_id)
        )
        user = cur.fetchone()
        
        if user:
            user_id = user[0]
        else:
            cur.execute(
                "INSERT INTO users (email, password_hash, first_name, last_name, avatar_url, oauth_provider, oauth_id) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (email, '', first_name, last_name, avatar_url, provider, oauth_id)
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
                    'last_name': last_name,
                    'avatar_url': avatar_url
                }
            })
        }
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Endpoint not found'})
    }