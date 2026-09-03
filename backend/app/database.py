import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    echo=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def ensure_user_profile_columns():
    """Add optional profile fields for databases created before these columns existed."""
    columns = {column["name"] for column in inspect(engine).get_columns("users")}
    missing_columns = {
        "phone": "VARCHAR(30)",
        "address": "VARCHAR(500)",
    }
    with engine.begin() as connection:
        for name, column_type in missing_columns.items():
            if name not in columns:
                connection.exec_driver_sql(f"ALTER TABLE users ADD COLUMN {name} {column_type}")
