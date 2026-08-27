import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
import os

import bcrypt


JWT_ALGORITHM = 'HS256'
JWT_EXPIRES_MINUTES = int(os.getenv('JWT_EXPIRES_MINUTES', '480'))
JWT_SECRET = os.getenv('JWT_SECRET', 'change-this-secret-in-production')


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except ValueError:
        return False


def create_access_token(user_id: int, email: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRES_MINUTES)
    payload = {
        'sub': str(user_id),
        'email': email,
        'exp': int(expires_at.timestamp()),
    }
    header = {'alg': JWT_ALGORITHM, 'typ': 'JWT'}
    encoded_header = _encode_part(header)
    encoded_payload = _encode_part(payload)
    unsigned_token = f'{encoded_header}.{encoded_payload}'
    signature = hmac.new(
        JWT_SECRET.encode('utf-8'),
        unsigned_token.encode('ascii'),
        hashlib.sha256,
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b'=').decode('ascii')
    return f'{unsigned_token}.{encoded_signature}'


def _encode_part(value: dict[str, object]) -> str:
    encoded = json.dumps(value, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    return base64.urlsafe_b64encode(encoded).rstrip(b'=').decode('ascii')
