from fastapi import Depends, HTTPException, status, Security
from fastapi.security import APIKeyCookie, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.database import get_db
from app.services.auth_service import SECRET_KEY, ALGORITHM, get_user_by_id
from app.models.user import User

# Support reading token from Bearer header or cookie
bearer_scheme = HTTPBearer(auto_error=False)
cookie_scheme = APIKeyCookie(name="session_token", auto_error=False)

def get_current_user(
    db: Session = Depends(get_db),
    token_bearer: HTTPAuthorizationCredentials = Security(bearer_scheme),
    token_cookie: str = Security(cookie_scheme)
) -> User:
    token = None
    if token_bearer:
        token = token_bearer.credentials
    elif token_cookie:
        token = token_cookie

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
        
    user = get_user_by_id(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user
