'''
Business: Send email notifications for authentication events
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with attributes: request_id, function_name
Returns: HTTP response dict with send status
'''
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    
    if not smtp_user or not smtp_password:
        return False
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_user
    msg['To'] = to_email
    
    html_part = MIMEText(html_content, 'html')
    msg.attach(html_part)
    
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(smtp_user, smtp_password)
    server.send_message(msg)
    server.quit()
    
    return True

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        email_type = body_data.get('type', '')
        to_email = body_data.get('to_email', '')
        data = body_data.get('data', {})
        
        if not to_email:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email required'})
            }
        
        if email_type == 'welcome':
            subject = 'Добро пожаловать! 🎉'
            html_content = f'''
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #E0E5EC; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 8px 8px 16px #c5cdd8, -8px -8px 16px #ffffff; }}
                    h1 {{ color: #4A5568; font-size: 32px; margin-bottom: 20px; }}
                    p {{ color: #718096; font-size: 16px; line-height: 1.6; }}
                    .button {{ display: inline-block; background: #A3B1C6; color: white; padding: 12px 30px; border-radius: 15px; text-decoration: none; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Добро пожаловать, {data.get('name', 'друг')}!</h1>
                    <p>Спасибо за регистрацию в нашей системе. Мы рады видеть вас!</p>
                    <p>Теперь вы можете воспользоваться всеми возможностями платформы.</p>
                    <a href="{data.get('app_url', '')}" class="button">Перейти в приложение</a>
                </div>
            </body>
            </html>
            '''
        
        elif email_type == 'password_reset':
            reset_token = data.get('reset_token', '')
            reset_url = data.get('reset_url', '')
            subject = 'Восстановление пароля 🔐'
            html_content = f'''
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #E0E5EC; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 8px 8px 16px #c5cdd8, -8px -8px 16px #ffffff; }}
                    h1 {{ color: #4A5568; font-size: 32px; margin-bottom: 20px; }}
                    p {{ color: #718096; font-size: 16px; line-height: 1.6; }}
                    .button {{ display: inline-block; background: #A3B1C6; color: white; padding: 12px 30px; border-radius: 15px; text-decoration: none; margin-top: 20px; }}
                    .token {{ background: #E0E5EC; padding: 15px; border-radius: 10px; font-family: monospace; word-break: break-all; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Восстановление пароля</h1>
                    <p>Вы запросили восстановление пароля. Нажмите кнопку ниже, чтобы создать новый пароль:</p>
                    <a href="{reset_url}?token={reset_token}" class="button">Восстановить пароль</a>
                    <p style="margin-top: 30px; font-size: 14px;">Ссылка действительна в течение 1 часа.</p>
                    <p style="font-size: 14px; color: #A0AEC0;">Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.</p>
                </div>
            </body>
            </html>
            '''
        
        elif email_type == 'password_changed':
            subject = 'Пароль изменен ✅'
            html_content = f'''
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #E0E5EC; padding: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px; box-shadow: 8px 8px 16px #c5cdd8, -8px -8px 16px #ffffff; }}
                    h1 {{ color: #4A5568; font-size: 32px; margin-bottom: 20px; }}
                    p {{ color: #718096; font-size: 16px; line-height: 1.6; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Пароль успешно изменен</h1>
                    <p>Ваш пароль был успешно изменен.</p>
                    <p style="margin-top: 20px; font-size: 14px; color: #A0AEC0;">Если это были не вы, немедленно свяжитесь с поддержкой.</p>
                </div>
            </body>
            </html>
            '''
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid email type'})
            }
        
        success = send_email(to_email, subject, html_content)
        
        if success:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Email sent successfully'})
            }
        else:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Failed to send email'})
            }
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Endpoint not found'})
    }