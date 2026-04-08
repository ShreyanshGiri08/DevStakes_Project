import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use SQLite for quick prototyping since no Docker/PG was explicitly set up in background yet, 
# but structuring the ORM properly so it's a 1-line change to PostgreSQL.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vector_visionary.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
