import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./route53.db")

print(f"DEBUG: Original DATABASE_URL prefix: {DATABASE_URL.split('://')[0] if '://' in DATABASE_URL else DATABASE_URL}")

# Render databases use postgres://, which SQLAlchemy 2.0 deprecated in favor of postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"DEBUG: Final DATABASE_URL prefix: {DATABASE_URL.split('://')[0] if '://' in DATABASE_URL else DATABASE_URL}")

# check_same_thread is only needed for SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
