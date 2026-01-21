import bcrypt
from typing import Optional
from datetime import datetime,timedelta
from jose import jwt, JWTError
from app.core.conf import JWT_SECRET_KEY,JWT_ACCESS_TOKEN_EXPIRE_MINUTES,JWT_ALGORITHM,JWT_REFRESH_TOKEN_EXPIRE_MINUTES,GOOGLE_CLIENT_ID
from app.common.logging.logging_config import Logger
from app.common.errors import ServerErrors,ClientErrors
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import hmac
import hashlib

async def hash_password(password:str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'),bcrypt.gensalt(rounds=10)).decode('utf-8')

async def verify_password(password:str,hashed_password:str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'),hashed_password.encode('utf-8'))

    
async def create_access_token(data:dict,expires_minute:Optional[int] = None) -> str:

    if not JWT_SECRET_KEY:
        raise ServerErrors(message="JWT_SECRET_KEY is not configured. Please contact administrator.")
    
    to_encode = data.copy()
    expires_minutes = expires_minute if expires_minute else JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)

    to_encode.update({
        "exp":expire
    })
    token= jwt.encode(to_encode,JWT_SECRET_KEY,algorithm=JWT_ALGORITHM)
    return token

    
async def create_refresh_token(data:dict,expires_minute:Optional[int] = None) -> str:

    if not JWT_SECRET_KEY:
        raise ServerErrors(message="JWT_SECRET_KEY is not configured. Please contact administrator.")
    
    to_encode = data.copy()
    expires_minutes = expires_minute if expires_minute else JWT_REFRESH_TOKEN_EXPIRE_MINUTES
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)

    to_encode.update({
        "exp":expire
    })
    token= jwt.encode(to_encode,JWT_SECRET_KEY,algorithm=JWT_ALGORITHM)
    return token



def decode_token(token: str) -> dict:
    """
    Decode JWT token and return payload
    Raises ValueError for token-related errors (will be caught and converted to CredentialError in dependencies)
    Raises ServerErrors for configuration errors
    """
    if not JWT_SECRET_KEY:
        raise ServerErrors(message="JWT_SECRET_KEY is not configured. Please contact administrator.")
    
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.JWTError:
        raise ValueError("Invalid token")

async def verify_github_signature(body:bytes,secret_key:str,x_hub_signature_256:bytes) -> bool:
    """
    Verify GitHub signature

    Args:
        body (bytes): The body of the request
        secret_key (str): The secret key for the GitHub webhook

    Returns:
        bool: True if signature is valid, False otherwise
    """
    
    signature = "sha256="+ hmac.new(
        secret_key.encode('utf-8'),
        body,
        hashlib.sha256
        
    ).hexdigest()
    
    
    return hmac.compare_digest(signature.encode('utf-8'),x_hub_signature_256)


async def verify_google_token(id_token_str) -> dict:
    
    """
    Verify the google id token
    """
    
    if not GOOGLE_CLIENT_ID:
        Logger.error("GOOGLE_CLIENT_ID is not configured. Please contact administrator.")
        raise ServerErrors(message="GOOGLE_CLIENT_ID is not configured. Please contact administrator.")
    
    
    try:
        idinfo = id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        
        # Verify issuer
        #iss stands for Issuer.
        if idinfo['iss'] not in ['accounts.google.com','https://accounts.google.com']:
            Logger.warning(f"Invalid Google token issuer: {idinfo['iss']}")
            raise ClientErrors(message="Invalid Google token issuer")
        return idinfo
    except ValueError as e:
        Logger.error(f"Error verifying Google token: {e}")
        raise ClientErrors(message="Error verifying Google token")
    except Exception as e:
        Logger.error(f"Unexpected Error verifying Google token: {e}")
        raise ClientErrors(message="Unexpected Error verifying Google token")
    
    
