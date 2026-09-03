from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr


class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: date | None = None
    age: int
    gender: str
    phone: str
    email: EmailStr | None = None
    address: str | None = None


class PatientRegister(BaseModel):
    full_name: str
    date_of_birth: date | None = None
    age: int
    gender: str
    phone: str
    email: EmailStr
    password: str
    address: str | None = None


class PatientLogin(BaseModel):
    email_or_id: str  # Can be email or sequential patient_id like "001"
    password: str


class PatientForgotPassword(BaseModel):
    email_or_id: str
    new_password: str



class PatientResponse(BaseModel):
    id: int
    patient_id: str
    full_name: str
    date_of_birth: date | None
    age: int
    gender: str
    phone: str
    email: str | None
    address: str | None

    model_config = ConfigDict(from_attributes=True)


class PatientAuthResponse(BaseModel):
    message: str
    patient: PatientResponse


class PatientUpdate(BaseModel):
    full_name: str | None = None
    date_of_birth: date | None = None
    age: int | None = None
    gender: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
