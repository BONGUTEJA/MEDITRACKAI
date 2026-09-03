from sqlalchemy import (
    Column,
    Integer,
    Date,
    Time,
    String,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False
    )

    doctor_id = Column(
        Integer,
        ForeignKey("doctors.id"),
        nullable=False
    )

    appointment_date = Column(
        Date,
        nullable=False
    )

    appointment_time = Column(
        Time,
        nullable=False
    )

    status = Column(
        String(20),
        default="Booked",
        nullable=False
    )

    reason = Column(
        String(255),
        nullable=True
    )

    # Prevent the same doctor from being booked
    # twice at the same date and time
    __table_args__ = (
        UniqueConstraint(
            "doctor_id",
            "appointment_date",
            "appointment_time",
            name="unique_doctor_appointment_slot"
        ),
    )

    patient = relationship("Patient")

    doctor = relationship("Doctor")