import os
import secrets
from datetime import datetime, timedelta
from email.message import EmailMessage

import aiosmtplib
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pwdlib import PasswordHash

from database import get_database_connection
from schemas.auth import RegisterRequest, VerifyEmailOTPRequest, LoginRequest
from security import create_access_token, verify_access_token
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

password_hash = PasswordHash.recommended()
security = HTTPBearer()

# --------------------------------------------------
# EMAIL SENDING FUNCTION
# --------------------------------------------------

async def send_email(to_email: str, otp: str):

    message = EmailMessage()

    message["From"] = os.getenv("EMAIL_USERNAME")
    message["To"] = to_email
    message["Subject"] = "University Project - Email Verification"

    message.set_content(
        f"""
Hello,

Your email verification OTP is: {otp}

This OTP is valid for 10 minutes.

Please do not share this OTP with anyone.

Regards,
University Project Management Platform
"""
    )

    result = await aiosmtplib.send(
        message,
        hostname=os.getenv("EMAIL_HOST"),
        port=int(os.getenv("EMAIL_PORT")),
        start_tls=True,
        username=os.getenv("EMAIL_USERNAME"),
        password=os.getenv("EMAIL_PASSWORD"),
    )

    print("SMTP RESULT:", result)


# --------------------------------------------------
# REGISTER STUDENT
# --------------------------------------------------

@router.post("/register")
def register_student(data: RegisterRequest):

    # Check university email
    email = data.email.strip().lower()

    if not email.endswith("@srmist.edu.in"):
        raise HTTPException(
            status_code=400,
            detail="Please use your university email address."
        )

    # Open database connection
    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Check duplicate Student ID, email, or phone
        cursor.execute(
            """
            SELECT student_id, university_student_id, email, phone
            FROM students
            WHERE university_student_id = %s
               OR email = %s
               OR phone = %s
            LIMIT 1
            """,
            (
                data.university_student_id.strip(),
                email,
                data.phone.strip()
            )
        )

        existing_student = cursor.fetchone()

        if existing_student:

            if (
                existing_student["university_student_id"]
                == data.university_student_id.strip()
            ):
                raise HTTPException(
                    status_code=409,
                    detail="Student ID is already registered."
                )

            if existing_student["email"] == email:
                raise HTTPException(
                    status_code=409,
                    detail="Email is already registered."
                )

            if existing_student["phone"] == data.phone.strip():
                raise HTTPException(
                    status_code=409,
                    detail="Phone number is already registered."
                )

        # Hash password
        hashed_password = password_hash.hash(data.password)

        # Create pending student
        cursor.execute(
            """
            INSERT INTO students
            (
                university_student_id,
                name,
                email,
                phone,
                department,
                password_hash
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                data.university_student_id.strip(),
                data.name.strip(),
                email,
                data.phone.strip(),
                data.department.strip(),
                hashed_password
            )
        )

        connection.commit()

        student_id = cursor.lastrowid

        return {
            "message": "Registration initiated successfully.",
            "student_id": student_id,
            "email_verified": False,
            "phone_verified": False,
            "account_status": "pending"
        }

    finally:
        cursor.close()
        connection.close()


# --------------------------------------------------
# SEND EMAIL OTP
# --------------------------------------------------

@router.post("/send-email-otp")
async def send_email_otp(student_id: int):

    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Find student
        cursor.execute(
            """
            SELECT student_id, email, email_verified
            FROM students
            WHERE student_id = %s
            """,
            (student_id,)
        )

        student = cursor.fetchone()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student account not found."
            )

        # Check whether email is already verified
        if student["email_verified"]:
            raise HTTPException(
                status_code=400,
                detail="Email is already verified."
            )

        # Generate secure 6-digit OTP
        otp = str(secrets.randbelow(900000) + 100000)

        # Hash OTP before storing
        hashed_otp = password_hash.hash(otp)

        # OTP expires after 10 minutes
        expires_at = datetime.now() + timedelta(minutes=10)

        # Store OTP hash
        cursor.execute(
            """
            INSERT INTO verification_codes
            (
                student_id,
                channel,
                otp_hash,
                expires_at
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                student_id,
                "email",
                hashed_otp,
                expires_at
            )
        )

        connection.commit()

        # Send actual OTP email
        await send_email(
            student["email"],
            otp
        )

        return {
            "message": "Email OTP sent successfully.",
            "student_id": student_id,
            "expires_in_minutes": 10
        }

    finally:
        cursor.close()
        connection.close()
# --------------------------------------------------
# VERIFY EMAIL OTP
# --------------------------------------------------

@router.post("/verify-email-otp")
def verify_email_otp(data: VerifyEmailOTPRequest):

    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Find the latest email OTP for this student
        cursor.execute(
            """
            SELECT verification_id, otp_hash, expires_at, verified
            FROM verification_codes
            WHERE student_id = %s
              AND channel = 'email'
            ORDER BY created_at DESC, verification_id DESC
            LIMIT 1
            """,
            (data.student_id,)
        )

        verification = cursor.fetchone()

        if not verification:
            raise HTTPException(
                status_code=404,
                detail="No email verification OTP found."
            )

        # Check whether this OTP was already used
        if verification["verified"]:
            raise HTTPException(
                status_code=400,
                detail="This OTP has already been used."
            )

        # Check OTP expiration
        if datetime.now() > verification["expires_at"]:
            raise HTTPException(
                status_code=400,
                detail="OTP has expired. Please request a new OTP."
            )

        # Verify entered OTP against stored hash
        if not password_hash.verify(
            data.otp,
            verification["otp_hash"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid OTP."
            )

        # Mark OTP as verified
        cursor.execute(
            """
            UPDATE verification_codes
            SET verified = TRUE
            WHERE verification_id = %s
            """,
            (verification["verification_id"],)
        )

        # Mark student's email as verified
        cursor.execute(
    """
    UPDATE students
    SET email_verified = TRUE,
        account_status = 'active'
    WHERE student_id = %s
    """,
    (data.student_id,)
)

        connection.commit()

        return {
            "message": "Email verified successfully.",
            "student_id": data.student_id,
            "email_verified": True
        }

    finally:
        cursor.close()
        connection.close()        
# --------------------------------------------------
# STUDENT LOGIN
# --------------------------------------------------

@router.post("/login")
def login_student(data: LoginRequest):

    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Find student by email
        cursor.execute(
            """
            SELECT
                student_id,
                university_student_id,
                name,
                email,
                phone,
                department,
                password_hash,
                email_verified,
                account_status
            FROM students
            WHERE email = %s
            LIMIT 1
            """,
            (data.email.strip().lower(),)
        )

        student = cursor.fetchone()

        # Student not found
        if not student:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        # Check account status
        if student["account_status"] != "active":
            raise HTTPException(
                status_code=403,
                detail="Account is not active. Please verify your email."
            )

        # Check email verification
        if not student["email_verified"]:
            raise HTTPException(
                status_code=403,
                detail="Please verify your university email first."
            )

        # Verify password
        if not password_hash.verify(
            data.password,
            student["password_hash"]
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )
        access_token = create_access_token(
    student["student_id"]
)
        return {
     "message": "Login successful.",
    "access_token": access_token,
    "token_type": "bearer",
    "student": {
        "student_id": student["student_id"],
        "university_student_id": student["university_student_id"],
        "name": student["name"],
        "email": student["email"],
        "phone": student["phone"],
        "department": student["department"]
            }
        }

    finally:
        cursor.close()
        connection.close()        
# --------------------------------------------------
# GET CURRENT STUDENT
# --------------------------------------------------

@router.get("/me")
def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    student_id = verify_access_token(
        credentials.credentials
    )

    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                student_id,
                university_student_id,
                name,
                email,
                phone,
                department,
                email_verified,
                account_status
            FROM students
            WHERE student_id = %s
            LIMIT 1
            """,
            (student_id,)
        )

        student = cursor.fetchone()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student account not found."
            )

        return {
            "message": "Authenticated student.",
            "student": student
        }

    finally:
        cursor.close()
        connection.close()        