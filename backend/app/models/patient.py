from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    # Primary Key
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )

    # Patient Basic Information
    full_name = Column(
        String(100),
        nullable=False
    )

    age = Column(
        Integer,
        nullable=False
    )

    gender = Column(
        String(20),
        nullable=False
    )

    date_of_birth = Column(
        Date,
        nullable=True
    )

    phone = Column(
        String(20),
        unique=True,
        nullable=False
    )

    email = Column(
        String(100),
        unique=True,
        nullable=True
    )

    address = Column(
        String(255),
        nullable=True
    )

    password_hash = Column(
        String(255),
        nullable=True
    )

    # One-to-One Relationship
    # One Patient has one Patient Profile
    profile = relationship(
        "PatientProfile",
        back_populates="patient",
        uselist=False,
        cascade="all, delete-orphan"
    )
