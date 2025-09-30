'''
Business: Admin panel - manage users, view activity logs, user roles
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with admin data or error
'''
import json
import os
import psycopg2
import hashlib
import hmac
import base64
import time
from typing import Dict, Any, Optional

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

def is_admin(user_id: int) -> bool:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    return user and user[0] == 'admin'

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
    
    if not is_admin(user_id):
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Admin access required'})
        }
    
    if method == 'GET' and path == 'users':
        conn = get_db_connection()
        cur = conn.cursor()
        
        page = int(event.get('queryStringParameters', {}).get('page', '1'))
        limit = 20
        offset = (page - 1) * limit
        
        cur.execute(
            "SELECT id, email, first_name, last_name, role, is_active, two_factor_enabled, created_at FROM users ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (limit, offset)
        )
        users = cur.fetchall()
        
        cur.execute("SELECT COUNT(*) FROM users")
        total_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user[0],
                'email': user[1],
                'first_name': user[2],
                'last_name': user[3],
                'role': user[4],
                'is_active': user[5],
                'two_factor_enabled': user[6],
                'created_at': user[7].isoformat() if user[7] else None
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'users': users_list,
                'total': total_count,
                'page': page,
                'pages': (total_count + limit - 1) // limit
            })
        }
    
    if method == 'PUT' and path == 'user-role':
        body_data = json.loads(event.get('body', '{}'))
        target_user_id = body_data.get('user_id')
        new_role = body_data.get('role', 'user')
        
        if not target_user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User ID required'})
            }
        
        if new_role not in ['user', 'admin', 'moderator']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid role'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "UPDATE users SET role = %s WHERE id = %s RETURNING id, email, role",
            (new_role, target_user_id)
        )
        updated_user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if not updated_user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Role updated',
                'user': {
                    'id': updated_user[0],
                    'email': updated_user[1],
                    'role': updated_user[2]
                }
            })
        }
    
    if method == 'PUT' and path == 'user-status':
        body_data = json.loads(event.get('body', '{}'))
        target_user_id = body_data.get('user_id')
        is_active = body_data.get('is_active', True)
        
        if not target_user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User ID required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "UPDATE users SET is_active = %s WHERE id = %s RETURNING id, email, is_active",
            (is_active, target_user_id)
        )
        updated_user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if not updated_user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'User status updated',
                'user': {
                    'id': updated_user[0],
                    'email': updated_user[1],
                    'is_active': updated_user[2]
                }
            })
        }
    
    if method == 'GET' and path == 'activity-log':
        conn = get_db_connection()
        cur = conn.cursor()
        
        page = int(event.get('queryStringParameters', {}).get('page', '1'))
        limit = 50
        offset = (page - 1) * limit
        
        cur.execute(
            "SELECT al.id, al.user_id, u.email, al.action, al.ip_address, al.created_at FROM user_activity_log al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT %s OFFSET %s",
            (limit, offset)
        )
        logs = cur.fetchall()
        
        cur.execute("SELECT COUNT(*) FROM user_activity_log")
        total_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        logs_list = []
        for log in logs:
            logs_list.append({
                'id': log[0],
                'user_id': log[1],
                'email': log[2],
                'action': log[3],
                'ip_address': log[4],
                'created_at': log[5].isoformat() if log[5] else None
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'logs': logs_list,
                'total': total_count,
                'page': page,
                'pages': (total_count + limit - 1) // limit
            })
        }
    
    if method == 'GET' and path == 'stats':
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM users")
        total_users = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        admin_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM users WHERE two_factor_enabled = TRUE")
        two_factor_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM users WHERE is_active = TRUE")
        active_users = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'total_users': total_users,
                'admin_count': admin_count,
                'two_factor_enabled_count': two_factor_count,
                'active_users': active_users
            })
        }
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Endpoint not found'})
    }