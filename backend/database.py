from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# echo: solo mostramos el SQL en logs cuando NO estamos en producción.
# Definí ENVIRONMENT=production como variable de entorno en Railway.
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

engine = create_engine(
    DATABASE_URL,
    echo=not IS_PRODUCTION,
    pool_pre_ping=True,   # verifica que la conexión siga viva antes de usarla;
                           # evita el clásico "MySQL server has gone away"
                           # cuando la base está en otro proveedor (Hostinger)
                           # y hubo un rato de inactividad.
    pool_recycle=280,     # recicla conexiones antes de que Hostinger las
                           # cierre por timeout del lado del servidor
                           # (ajustá si tu plan tiene otro wait_timeout).
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()