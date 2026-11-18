from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from database import get_database_connection
from security import (
    get_current_student_id,
    get_current_faculty_id,
)


router = APIRouter(
    prefix="/feedback",
    tags=["Feedback Management"],
)


# ==========================================================
# REQUEST SCHEMAS
# ==========================================================

class CreateFeedbackRequest(BaseModel):
    project_id: int
    comment: str = Field(min_length=3, max_length=10000)


class StudentFeedbackResponse(BaseModel):
    student_response: str = Field(
        min_length=1,
        max_length=10000,
    )


# ==========================================================
# DATABASE CLEANUP
# ==========================================================

def close_database_resources(cursor=None, connection=None):
    if cursor:
        cursor.close()

    if connection:
        connection.close()


# ==========================================================
# FACULTY: GET ASSIGNED PROJECTS
# ==========================================================

@router.get("/faculty/projects")
def get_faculty_projects(
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
                p.project_id,
                p.title,
                p.student_id,
                s.name AS student_name,
                p.status AS project_status
            FROM projects p
            INNER JOIN students s
                ON s.student_id = p.student_id
            WHERE p.assigned_faculty_id = %s
            ORDER BY p.created_at DESC
            """,
            (faculty_id,),
        )

        projects = cursor.fetchall()

        return {
            "count": len(projects),
            "projects": projects,
        }

    except Exception as error:
        print("Unable to retrieve faculty projects:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve assigned projects.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# FACULTY: CREATE FEEDBACK
# ==========================================================

@router.post("/")
def create_feedback(
    request: CreateFeedbackRequest,
    faculty_id: int = Depends(get_current_faculty_id),
):
    connection = None
    cursor = None

    try:
        comment = request.comment.strip()

        if len(comment) < 3:
            raise HTTPException(
                status_code=422,
                detail="Feedback must contain at least 3 characters.",
            )

        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        # Verify that this project belongs to a student and
        # is assigned to the logged-in faculty member.
        cursor.execute(
            """
            SELECT
                project_id,
                title,
                student_id
            FROM projects
            WHERE project_id = %s
              AND assigned_faculty_id = %s
            """,
            (request.project_id, faculty_id),
        )

        project = cursor.fetchone()

        if not project:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You can provide feedback only for projects "
                    "assigned to your faculty account."
                ),
            )

        cursor.execute(
            """
            INSERT INTO feedback (
                project_id,
                faculty_id,
                comment,
                status
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                request.project_id,
                faculty_id,
                comment,
                "open",
            ),
        )

        feedback_id = cursor.lastrowid

        connection.commit()

        return {
            "message": "Feedback submitted successfully.",
            "feedback": {
                "feedback_id": feedback_id,
                "project_id": project["project_id"],
                "project_title": project["title"],
                "student_id": project["student_id"],
                "faculty_id": faculty_id,
                "comment": comment,
                "status": "open",
                "student_response": None,
            },
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as error:
        if connection:
            connection.rollback()

        print("Unable to create feedback:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to submit feedback.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# FACULTY: VIEW FEEDBACK FOR ASSIGNED PROJECTS
# ==========================================================

@router.get("/faculty")
def get_faculty_feedback(
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
                fb.feedback_id,
                fb.project_id,
                p.title AS project_title,
                p.student_id,
                s.name AS student_name,
                fb.faculty_id,
                fb.comment,
                fb.status,
                fb.student_response,
                fb.created_at,
                fb.resolved_at
            FROM feedback fb
            INNER JOIN projects p
                ON p.project_id = fb.project_id
            INNER JOIN students s
                ON s.student_id = p.student_id
            WHERE fb.faculty_id = %s
              AND p.assigned_faculty_id = %s
            ORDER BY fb.created_at DESC, fb.feedback_id DESC
            """,
            (faculty_id, faculty_id),
        )

        feedback_items = cursor.fetchall()

        return {
            "count": len(feedback_items),
            "open_count": sum(
                1 for item in feedback_items
                if item["status"] == "open"
            ),
            "resolved_count": sum(
                1 for item in feedback_items
                if item["status"] == "resolved"
            ),
            "feedback": feedback_items,
        }

    except Exception as error:
        print("Unable to retrieve faculty feedback:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve faculty feedback.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# STUDENT: VIEW FEEDBACK FOR THEIR OWN PROJECTS
# ==========================================================

@router.get("/student")
def get_student_feedback(
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
                fb.feedback_id,
                fb.project_id,
                p.title AS project_title,
                fb.faculty_id,
                f.name AS faculty_name,
                f.department AS faculty_department,
                fb.comment,
                fb.status,
                fb.student_response,
                fb.created_at,
                fb.resolved_at
            FROM feedback fb
            INNER JOIN projects p
                ON p.project_id = fb.project_id
            LEFT JOIN faculty f
                ON f.faculty_id = fb.faculty_id
            WHERE p.student_id = %s
            ORDER BY fb.created_at DESC, fb.feedback_id DESC
            """,
            (student_id,),
        )

        feedback_items = cursor.fetchall()

        return {
            "count": len(feedback_items),
            "open_count": sum(
                1 for item in feedback_items
                if item["status"] == "open"
            ),
            "resolved_count": sum(
                1 for item in feedback_items
                if item["status"] == "resolved"
            ),
            "feedback": feedback_items,
        }

    except Exception as error:
        print("Unable to retrieve student feedback:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve your feedback.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# STUDENT: RESPOND TO FEEDBACK
# ==========================================================

@router.patch("/{feedback_id}/response")
def respond_to_feedback(
    feedback_id: int,
    request: StudentFeedbackResponse,
    student_id: int = Depends(get_current_student_id),
):
    connection = None
    cursor = None

    response_text = request.student_response.strip()

    if not response_text:
        raise HTTPException(
            status_code=422,
            detail="Please enter a response.",
        )

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                fb.feedback_id,
                fb.project_id,
                fb.status
            FROM feedback fb
            INNER JOIN projects p
                ON p.project_id = fb.project_id
            WHERE fb.feedback_id = %s
              AND p.student_id = %s
            """,
            (feedback_id, student_id),
        )

        feedback_item = cursor.fetchone()

        if not feedback_item:
            raise HTTPException(
                status_code=404,
                detail="Feedback not found in your projects.",
            )

        if feedback_item["status"] == "resolved":
            raise HTTPException(
                status_code=409,
                detail=(
                    "This feedback has already been resolved. "
                    "A new feedback item is required for further corrections."
                ),
            )

        cursor.execute(
            """
            UPDATE feedback
            SET student_response = %s
            WHERE feedback_id = %s
            """,
            (response_text, feedback_id),
        )

        connection.commit()

        return {
            "message": "Your response was submitted successfully.",
            "feedback_id": feedback_id,
            "student_response": response_text,
            "status": feedback_item["status"],
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as error:
        if connection:
            connection.rollback()

        print("Unable to save student response:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to submit your response.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# FACULTY: RESOLVE FEEDBACK
# ==========================================================

@router.patch("/{feedback_id}/resolve")
def resolve_feedback(
    feedback_id: int,
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
                fb.feedback_id,
                fb.project_id,
                fb.status
            FROM feedback fb
            INNER JOIN projects p
                ON p.project_id = fb.project_id
            WHERE fb.feedback_id = %s
              AND fb.faculty_id = %s
              AND p.assigned_faculty_id = %s
            """,
            (feedback_id, faculty_id, faculty_id),
        )

        feedback_item = cursor.fetchone()

        if not feedback_item:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Feedback not found for your assigned projects."
                ),
            )

        if feedback_item["status"] == "resolved":
            raise HTTPException(
                status_code=409,
                detail="This feedback has already been resolved.",
            )

        cursor.execute(
            """
            UPDATE feedback
            SET
                status = 'resolved',
                resolved_at = CURRENT_TIMESTAMP
            WHERE feedback_id = %s
              AND faculty_id = %s
            """,
            (feedback_id, faculty_id),
        )

        connection.commit()

        return {
            "message": "Feedback marked as resolved.",
            "feedback_id": feedback_id,
            "status": "resolved",
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as error:
        if connection:
            connection.rollback()

        print("Unable to resolve feedback:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to resolve feedback.",
        )

    finally:
        close_database_resources(cursor, connection)