from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    university_student_id: str = Field(min_length=1, max_length=50)
    email: str = Field(min_length=5, max_length=150)
    phone: str = Field(min_length=10, max_length=20)
    department: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)
class VerifyEmailOTPRequest(BaseModel):
    student_id: int
    otp: str = Field(min_length=6, max_length=6)    
class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=150)
    password: str = Field(min_length=8, max_length=128)    