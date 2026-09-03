from sqlalchemy import Column, Integer, String, Text, Date, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Consultation(Base):
    __tablename__ = 'consultations'

    id = Column(Integer, primary_key=True, index=True)

    appointment_id = Column(Integer, ForeignKey('appointments.id'), nullable=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    doctor_id = Column(Integer, ForeignKey('doctors.id'), nullable=False)

    consultation_date = Column(Date, nullable=False)
    symptoms = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)

    # Vital Signs
    vital_bp = Column(String(50), nullable=True)
    vital_heart_rate = Column(Integer, nullable=True)
    vital_temperature = Column(Float, nullable=True)
    vital_weight = Column(Float, nullable=True)
    vital_spo2 = Column(Integer, nullable=True)

    follow_up_date = Column(Date, nullable=True)
    status = Column(String(50), default='Completed', nullable=False)

    patient = relationship('Patient')
    doctor = relationship('Doctor')
    appointment = relationship('Appointment')
    prescriptions = relationship('Prescription', back_populates='consultation', cascade='all, delete-orphan')