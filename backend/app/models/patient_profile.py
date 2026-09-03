from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        unique=True,
        nullable=False
    )

    blood_group = Column(String(10), nullable=True)

    allergies = Column(Text, nullable=True)

    existing_diseases = Column(Text, nullable=True)

    medical_history = Column(Text, nullable=True)

    current_medications = Column(Text, nullable=True)

    emergency_contact = Column(String(20), nullable=True)

    insurance_details = Column(Text, nullable=True)

    patient = relationship(
        "Patient",
        back_populates="profile"
    )