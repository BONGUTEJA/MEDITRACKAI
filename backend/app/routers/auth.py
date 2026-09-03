from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserProfileUpdate, ForgotPasswordRequest
from app.services.auth_service import register_user, login_user, forgot_password_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    return register_user(db, user)

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, user)

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return forgot_password_user(db, req.email, req.new_password)


@router.get("/users/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "phone": user.phone, "address": user.address}

@router.put("/users/{user_id}")
def update_user_profile(user_id: int, data: UserProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    name = data.name.strip()
    email = str(data.email).strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    existing_user = db.query(User).filter(User.email == email, User.id != user_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user.name = name
    user.email = email
    user.phone = data.phone.strip() if data.phone else None
    user.address = data.address.strip() if data.address else None
    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "phone": user.phone, "address": user.address},
    }
