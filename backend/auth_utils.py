import os
import bcrypt
import hashlib
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Cuánto dura un enlace de "olvidé mi contraseña" antes de vencer.
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))
RESET_TOKEN_PURPOSE = "password_reset"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ==================== RESETEO DE CONTRASEÑA ====================

def _password_fingerprint(password_hash: str) -> str:
    """
    Huella corta y no reversible del hash de contraseña actual del
    usuario. La incluimos DENTRO del token de reseteo firmado.

    Truco: como el hash de contraseña cambia cada vez que el usuario
    la actualiza, esta huella deja de coincidir apenas se usa el
    enlace una vez. Así conseguimos que el token sea de un solo uso
    sin necesitar una tabla en la base para llevar registro de tokens
    ya usados.
    """
    return hashlib.sha256(password_hash.encode("utf-8")).hexdigest()[:16]


def create_password_reset_token(user) -> str:
    """Genera el token que va dentro del link del email de recuperación."""
    payload = {
        "sub": str(user.id),
        "purpose": RESET_TOKEN_PURPOSE,
        "pwd_fp": _password_fingerprint(user.password_hash),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_password_reset_token(token: str) -> dict | None:
    """
    Decodifica el token y confirma que sea específicamente uno de
    reseteo de contraseña (no un access_token normal reutilizado acá
    por error). No confirma todavía que siga vigente para ESTE
    usuario — eso requiere consultar la base, ver is_reset_token_still_valid.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

    if payload.get("purpose") != RESET_TOKEN_PURPOSE:
        return None

    return payload


def is_reset_token_still_valid(payload: dict, user) -> bool:
    """
    Confirma que el token corresponda a este usuario Y que la
    contraseña no haya cambiado desde que se generó el enlace
    (si ya se usó una vez, esto da False).
    """
    if payload.get("sub") != str(user.id):
        return False
    if payload.get("pwd_fp") != _password_fingerprint(user.password_hash):
        return False
    return True