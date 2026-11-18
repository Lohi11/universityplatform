from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pwdlib import PasswordHash

from database import get_database_connection
from security import create_faculty_access_token

router = APIRouter(
    prefix="/faculty-auth",
    tags=["Faculty Authentication"],
)

password_hasher = PasswordHash.recommended()


class FacultyLoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


@router.post("/login")
def faculty_login(request: FacultyLoginRequest):
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                faculty_id,
                name,
                email,
                department,
                designation,
                specialization,
                research_interests,
                accepting_requests,
                password_hash,
                account_status
            FROM faculty
            WHERE email = %s
            LIMIT 1
            """,
            (request.email.strip(),),
        )

        faculty = cursor.fetchone()

        if not faculty or faculty["account_status"] != "active":
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            )

        try:
            password_is_valid = password_hasher.verify(
                request.password,
                faculty["password_hash"],
            )
        except Exception:
            password_is_valid = False

        if not password_is_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            )

        access_token = create_faculty_access_token(
            faculty["faculty_id"]
        )

        return {
            "message": "Faculty login successful.",
            "access_token": access_token,
            "token_type": "bearer",
            "faculty": {
                "faculty_id": faculty["faculty_id"],
                "name": faculty["name"],
                "email": faculty["email"],
                "department": faculty["department"],
                "designation": faculty["designation"],
                "specialization": faculty["specialization"],
                "research_interests": faculty["research_interests"],
                "accepting_requests": faculty["accepting_requests"],
            },
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Faculty login error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to process faculty login.",
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()