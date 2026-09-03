from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

