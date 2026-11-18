from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from database import get_database_connection
from security import (
    get_current_student_id,
    get_current_faculty_id,
)

router = APIRouter(
    prefix="/guidance",
    tags=["Faculty Guidance"],
)


# --------------------------------------------------
# REQUEST SCHEMAS
# --------------------------------------------------

class CreateGuidanceRequest(BaseModel):
    project_id: int
    faculty_id: int
    message: str = Field(min_length=3, max_length=2000)


class GuidanceDecisionRequest(BaseModel):
    status: Literal["accepted", "rejected"]
    response_message: str = Field(default="", max_length=2000)


# --------------------------------------------------
# STUDENT: GET AVAILABLE FACULTY
# --------------------------------------------------

@router.get("/faculty")
def get_available_faculty(
    student_id: int = Depends(get_current_student_id),
):
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
                accepting_requests
            FROM faculty
            WHERE account_status = 'active'
              AND accepting_requests = 1
            ORDER BY name
            """
        )

        faculty_members = cursor.fetchall()

        return {
            "count": len(faculty_members),
            "faculty": faculty_members,
        }

    except Exception as error:
        print("Error retrieving faculty:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve faculty members.",
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# STUDENT: CREATE GUIDANCE REQUEST
# --------------------------------------------------

@router.post("/requests")
def create_guidance_request(
    request: CreateGuidanceRequest,
    student_id: int = Depends(get_current_student_id),
):
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                project_id,
                title,
                assigned_faculty_id
            FROM projects
            WHERE project_id = %s
              AND student_id = %s
            """,
            (request.project_id, student_id),
        )

        project = cursor.fetchone()

        if not project:
            raise HTTPException(
                status_code=404,
                detail="Project not found in your account.",
            )

        if project["assigned_faculty_id"] is not None:
            raise HTTPException(
                status_code=409,
                detail="A faculty member is already assigned to this project.",
            )

        cursor.execute(
            """
            SELECT faculty_id
            FROM faculty
            WHERE faculty_id = %s
              AND account_status = 'active'
              AND accepting_requests = 1
            """,
            (request.faculty_id,),
        )

        faculty_member = cursor.fetchone()

        if not faculty_member:
            raise HTTPException(
                status_code=404,
                detail="The selected faculty member is unavailable.",
            )

        cursor.execute(
            """
            SELECT request_id
            FROM guidance_requests
            WHERE project_id = %s
              AND status IN ('pending', 'accepted')
            LIMIT 1
            """,
            (request.project_id,),
        )

        existing_request = cursor.fetchone()

        if existing_request:
            raise HTTPException(
                status_code=409,
                detail=(
                    "A pending or accepted guidance request "
                    "already exists for this project."
                ),
            )

        cursor.execute(
            """
            INSERT INTO guidance_requests (
                project_id,
                faculty_id,
                message,
                status
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                request.project_id,
                request.faculty_id,
                request.message.strip(),
                "pending",
            ),
        )

        request_id = cursor.lastrowid
        connection.commit()

        return {
            "message": "Guidance request submitted successfully.",
            "request": {
                "request_id": request_id,
                "project_id": request.project_id,
                "project_title": project["title"],
                "faculty_id": request.faculty_id,
                "status": "pending",
                "message": request.message.strip(),
            },
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as error:
        if connection:
            connection.rollback()

        print("Error creating guidance request:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to submit the guidance request.",
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# STUDENT: VIEW THEIR GUIDANCE REQUESTS
# --------------------------------------------------

@router.get("/my-requests")
def get_my_guidance_requests(
    student_id: int = Depends(get_current_student_id),
):
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                gr.request_id,
                gr.project_id,
                p.title AS project_title,
                gr.faculty_id,
                f.name AS faculty_name,
                f.department AS faculty_department,
                gr.message,
                gr.status,
                gr.response_message,
                gr.requested_at,
                gr.responded_at
            FROM guidance_requests gr
            INNER JOIN projects p
                ON p.project_id = gr.project_id
            LEFT JOIN faculty f
                ON f.faculty_id = gr.faculty_id
            WHERE p.student_id = %s
            ORDER BY gr.requested_at DESC
            """,
            (student_id,),
        )

        requests = cursor.fetchall()

        return {
            "count": len(requests),
            "requests": requests,
        }

    except Exception as error:
        print("Error retrieving student requests:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve your guidance requests.",
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# FACULTY: VIEW THEIR OWN GUIDANCE REQUESTS
# --------------------------------------------------

@router.get("/faculty/requests")
def get_faculty_guidance_requests(
    faculty_id: int = Depends(get_current_faculty_id),
):
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                gr.request_id,
                gr.project_id,
                gr.faculty_id,
                gr.message,
                gr.status,
                gr.response_message,
                gr.requested_at,
                gr.responded_at,

                p.student_id,
                p.title AS project_title,
                p.problem_statement,
                p.objectives,
                p.description,
                p.technologies,
                p.status AS project_status,
                p.created_at AS project_created_at

            FROM guidance_requests gr

            INNER JOIN projects p
                ON p.project_id = gr.project_id

            WHERE gr.faculty_id = %s

            ORDER BY
                CASE
                    WHEN gr.status = 'pending' THEN 0
                    ELSE 1
                END,
                gr.requested_at DESC
            """,
            (faculty_id,),
        )

        requests = cursor.fetchall()

        pending_count = sum(
            1 for item in requests
            if str(item["status"]).lower() == "pending"
        )

        accepted_count = sum(
            1 for item in requests
            if str(item["status"]).lower() == "accepted"
        )

        rejected_count = sum(
            1 for item in requests
            if str(item["status"]).lower() == "rejected"
        )

        return {
            "count": len(requests),
            "pending_count": pending_count,
            "accepted_count": accepted_count,
            "rejected_count": rejected_count,
            "requests": requests,
        }

    except Exception as error:
        print("Error retrieving faculty requests:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve faculty guidance requests.",
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# --------------------------------------------------
# FACULTY: ACCEPT OR REJECT A REQUEST
# --------------------------------------------------

@router.patch("/requests/{request_id}/decision")
def decide_guidance_request(
    request_id: int,
    decision: GuidanceDecisionRequest,
    faculty_id: int = Depends(get_current_faculty_id),
):
    connection = None
    cursor = None

    response_message = decision.response_message.strip()

    if decision.status == "rejected" and len(response_message) < 3:
        raise HTTPException(
            status_code=422,
            detail="Please provide a rejection reason of at least 3 characters.",
        )

    try:
        connection = get_database_connection()
        connection.start_transaction()

        cursor = connection.cursor(dictionary=True)

        # A faculty member can only act on their own request.
        cursor.execute(
            """
            SELECT
                gr.request_id,
                gr.project_id,
                gr.faculty_id,
                gr.status,
                gr.message,
                p.title AS project_title,
                p.assigned_faculty_id

            FROM guidance_requests gr

            INNER JOIN projects p
                ON p.project_id = gr.project_id

            WHERE gr.request_id = %s
              AND gr.faculty_id = %s

            FOR UPDATE
            """,
            (request_id, faculty_id),
        )

        guidance_request = cursor.fetchone()

        if not guidance_request:
            raise HTTPException(
                status_code=404,
                detail="Guidance request not found for this faculty account.",
            )

        if str(guidance_request["status"]).lower() != "pending":
            raise HTTPException(
                status_code=409,
                detail="This request has already been processed.",
            )

        project_id = guidance_request["project_id"]

        if decision.status == "accepted":
            assigned_faculty_id = guidance_request["assigned_faculty_id"]

            if (
                assigned_faculty_id is not None
                and assigned_faculty_id != faculty_id
            ):
                raise HTTPException(
                    status_code=409,
                    detail="Another faculty member is already assigned to this project.",
                )

            # Assign the project to this faculty member.
            cursor.execute(
                """
                UPDATE projects
                SET assigned_faculty_id = %s
                WHERE project_id = %s
                """,
                (faculty_id, project_id),
            )

        # Store the faculty's decision and response.
        cursor.execute(
            """
            UPDATE guidance_requests
            SET
                status = %s,
                response_message = %s,
                responded_at = CURRENT_TIMESTAMP
            WHERE request_id = %s
              AND faculty_id = %s
              AND status = 'pending'
            """,
            (
                decision.status,
                response_message or None,
                request_id,
                faculty_id,
            ),
        )

        if cursor.rowcount != 1:
            raise HTTPException(
                status_code=409,
                detail="The request could not be updated. Please refresh and try again.",
            )

        connection.commit()

        return {
            "message": (
                "Guidance request accepted."
                if decision.status == "accepted"
                else "Guidance request rejected."
            ),
            "request": {
                "request_id": request_id,
                "project_id": project_id,
                "project_title": guidance_request["project_title"],
                "faculty_id": faculty_id,
                "status": decision.status,
                "response_message": response_message or None,
                "assigned_faculty_id": (
                    faculty_id
                    if decision.status == "accepted"
                    else guidance_request["assigned_faculty_id"]
                ),
            },
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as error:
        if connection:
            connection.rollback()

        print("Error deciding guidance request:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to update the guidance request.",
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()