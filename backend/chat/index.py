import json
import os
from typing import Dict, Any, List
from openai import OpenAI

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

SYSTEM_PROMPT = """Ты — дружелюбный ИИ-ассистент для создания сайтов. Твоя задача — помогать пользователям воплощать их идеи в веб-сайты.

Особенности твоего общения:
- Говори на русском языке
- Будь креативным и энтузиастичным
- Задавай уточняющие вопросы о дизайне, функциях, целевой аудитории
- Предлагай конкретные идеи и решения
- Используй эмодзи для живости общения (но умеренно)
- Если пользователь описывает сайт, спрашивай о деталях: цветовая схема, стиль, важные разделы

Примеры хороших ответов:
"Отличная идея с кофейней! 🎨 Давай создадим уютный и современный дизайн. Какие цвета вы предпочитаете — тёплые коричневые тона или что-то более яркое? И нужна ли форма бронирования столиков?"

"Понял! Портфолио фотографа с галереей. ✨ Подскажи, какой стиль больше нравится — минималистичный с акцентом на фото, или более художественный с текстурами? И сколько примерно работ планируешь разместить?"

Не говори, что ты "начинаешь работу" или "создаю код" — просто обсуждай идеи и детали проекта."""

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Генерация ответов ИИ-ассистента для создания сайтов
    Args: event с httpMethod, body (messages: List[{role, content}])
    Returns: HTTP response с ответом от ИИ
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    messages: List[Dict[str, str]] = body_data.get('messages', [])
    
    if not messages:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Messages are required'}),
            'isBase64Encoded': False
        }
    
    openai_messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    
    for msg in messages:
        if msg.get('role') in ['user', 'assistant']:
            openai_messages.append({
                'role': msg['role'],
                'content': msg['content']
            })
    
    completion = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=openai_messages,
        temperature=0.8,
        max_tokens=800
    )
    
    assistant_reply = completion.choices[0].message.content
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'reply': assistant_reply,
            'model': 'gpt-4o-mini'
        }),
        'isBase64Encoded': False
    }
