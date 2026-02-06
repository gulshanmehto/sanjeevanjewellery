"""Utility functions for password hashing, JWT, etc."""
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt
from config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: int = None) -> tuple[str, int]:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary with token claims
        expires_delta: Expiration time in hours (default from settings)
    
    Returns:
        Tuple of (token, expires_in_seconds)
    """
    to_encode = data.copy()
    
    if expires_delta is None:
        expires_delta = settings.JWT_EXPIRATION_HOURS
    
    expire = datetime.now(timezone.utc) + timedelta(hours=expires_delta)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    # Calculate seconds until expiration
    expires_in = int(expires_delta * 3600)
    
    return encoded_jwt, expires_in


def verify_token(token: str) -> dict:
    """
    Verify a JWT token and return the payload.
    
    Args:
        token: JWT token string
    
    Returns:
        Token payload dictionary
    
    Raises:
        jwt.InvalidTokenError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}") from e


def validate_email_format(email: str) -> bool:
    """Validate basic email format."""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_file_format(filename: str, allowed_formats: list) -> bool:
    """Validate that file has an allowed format."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in allowed_formats
