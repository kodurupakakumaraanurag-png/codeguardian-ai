import requests
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from backend.app.config import settings

security = HTTPBearer(auto_error=False)

# In-memory cache for Clerk JWKS keys
_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    
    # If Clerk Keys are not configured, return empty
    if not settings.CLERK_JWKS_URL or "clerk.dev" in settings.CLERK_JWKS_URL:
        return None
        
    try:
        response = requests.get(settings.CLERK_JWKS_URL, timeout=5)
        if response.status_code == 200:
            _jwks_cache = response.json()
            return _jwks_cache
    except Exception as e:
        print(f"Failed to fetch JWKS from Clerk: {e}")
    return None

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Verifies the JWT token from Clerk.
    Returns the user ID (sub claim) if valid.
    """
    default_mock_user = "mock_user_dev"
    
    # Check if authentication should be bypassed
    if settings.BYPASS_AUTH:
        return default_mock_user

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_411_LENGTH_REQUIRED if not settings.BYPASS_AUTH else status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or invalid"
        )
    
    token = credentials.credentials
    
    jwks = get_jwks()
    if not jwks:
        # Fallback to bypass/mock if Clerk JWKS URL is unconfigured
        return default_mock_user

    try:
        # Get the unverified header to identify the key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token header missing 'kid'"
            )

        # Find the correct public key in JWKS
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = {
                    "kty": key.get("kty"),
                    "kid": key.get("kid"),
                    "use": key.get("use"),
                    "n": key.get("n"),
                    "e": key.get("e")
                }
                break

        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Public key not found in JWKS"
            )

        # Verify the signature and claims
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False} # Skip audience check unless configured
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing subject ('sub') claim"
            )
            
        return user_id

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authorization failed: {str(e)}"
        )
