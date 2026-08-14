import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./route53.db")

# Mask password in URL for safe logging
def get_masked_url(url: str) -> str:
    try:
        if "@" in url:
            parts = url.split("@")
            prefix = parts[0]
            suffix = parts[1]
            if ":" in prefix:
                subparts = prefix.split(":")
                # scheme://user:***
                return f"{subparts[0]}:{subparts[1]}:***@{suffix}"
        return url
    except Exception:
        return "invalid-url-format"

print(f"DEBUG: Original URL (Masked): {get_masked_url(DATABASE_URL)}", flush=True)

# Render databases use postgres://, which SQLAlchemy 2.0 deprecated in favor of postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"DEBUG: Final URL (Masked): {get_masked_url(DATABASE_URL)}", flush=True)

# check_same_thread is only needed for SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
except Exception as e:
    print(f"ERROR: Failed to create engine for URL: {get_masked_url(DATABASE_URL)}. Details: {e}", flush=True)
    raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
