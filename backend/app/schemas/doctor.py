from pydantic import BaseModel, EmailStr


class DoctorCreate(BaseModel):

    full_name: str
    specialization: str
    phone: str
    email: EmailStr