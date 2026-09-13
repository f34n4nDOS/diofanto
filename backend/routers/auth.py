import os
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
import models
import schemas
from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    is_reset_token_still_valid,
)
from email_utils import send_password_reset_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# URL base del frontend, para armar el link que va dentro del email.
# En Railway: FRONTEND_URL=https://diofanto.xyz
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://diofanto.xyz")


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ese email ya está registrado")

    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ==================== RECUPERACIÓN DE CONTRASEÑA ====================

@router.post("/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Recibe un email y, si corresponde a una cuenta registrada, envía un
    link de recuperación. SIEMPRE devuelve el mismo mensaje genérico,
    exista o no el email — así nadie puede usar este endpoint para
    averiguar qué direcciones están registradas en el sistema.
    """
    generic_message = "Si el email está registrado, te enviamos un enlace para restablecer tu contraseña."

    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        return {"detail": generic_message}

    token = create_password_reset_token(user)
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    try:
        send_password_reset_email(user.email, reset_link)
    except Exception as e:
        # No dejamos que un fallo de envío (Resend caído, dominio no
        # verificado, etc.) le confirme a quien sea que el email sí
        # existe en el sistema devolviendo un error distinto.
        logger.error("No se pudo enviar el email de recuperación a %s: %s", user.email, e)

    return {"detail": generic_message}


@router.post("/reset-password", response_model=schemas.MessageResponse)
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Recibe el token del link del email y la nueva contraseña, y la
    actualiza si el token es válido, no expiró, y no fue usado ya.
    """
    payload = decode_password_reset_token(req.token)
    if not payload:
        raise HTTPException(status_code=400, detail="El enlace es inválido o ya expiró")

    user = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()
    if not user or not is_reset_token_still_valid(payload, user):
        raise HTTPException(status_code=400, detail="El enlace es inválido, ya expiró, o ya fue usado")

    user.password_hash = hash_password(req.new_password)
    db.commit()

    return {"detail": "Contraseña actualizada correctamente. Ya podés iniciar sesión."}