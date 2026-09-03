from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Prescription(Base):
    __tablename__ = 'prescriptions'

    id = Column(Integer, primary_key=True, index=True)

    consultation_id = Column(Integer, ForeignKey('consultations.id'), nullable=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)

    issue_date = Column(Date, nullable=False)
    general_instructions = Column(Text, nullable=True)

    consultation = relationship('Consultation', back_populates='prescriptions')
    patient = relationship('Patient')
    doctor = relationship('Doctor')
    items = relationship('PrescriptionItem', back_populates='prescription', cascade='all, delete-orphan')


class PrescriptionItem(Base):
    __tablename__ = 'prescription_items'

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey('prescriptions.id'), nullable=False)

    medicine_name = Column(String(150), nullable=False)
    dosage = Column(String(100), nullable=False)          # e.g. '500 mg' or '1 Tablet'
    frequency = Column(String(100), nullable=False)       # e.g. '1-0-1' or 'Twice daily'
    duration = Column(String(100), nullable=False)        # e.g. '5 Days'
    instructions = Column(String(255), nullable=True)     # e.g. 'After food'

    prescription = relationship('Prescription', back_populates='items')