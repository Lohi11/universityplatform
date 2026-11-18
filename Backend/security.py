import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

security = HTTPBearer()


def create_access_token(student_id: int):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "student_id": student_id,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def create_faculty_access_token(faculty_id: int):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "faculty_id": faculty_id,
        "role": "faculty",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str):
    try:
        return jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )


def verify_access_token(token: str):
    payload = decode_access_token(token)

    student_id = payload.get("student_id")

    if student_id is None or payload.get("role") == "faculty":
        raise HTTPException(
            status_code=401,
            detail="Invalid student authentication token.",
        )

    return int(student_id)


def verify_faculty_access_token(token: str):
    payload = decode_access_token(token)

    faculty_id = payload.get("faculty_id")

    if faculty_id is None or payload.get("role") != "faculty":
        raise HTTPException(
            status_code=401,
            detail="Invalid faculty authentication token.",
        )

    return int(faculty_id)


def get_current_student_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    return verify_access_token(credentials.credentials)


def get_current_faculty_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    return verify_faculty_access_token(credentials.credentials)