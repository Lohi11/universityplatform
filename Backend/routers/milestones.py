from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from database import get_database_connection
from security import (
    get_current_student_id,
    get_current_faculty_id,
)

router = APIRouter(
    prefix="/milestones",
    tags=["Milestones Management"],
)


# ==========================================================
# REQUEST SCHEMAS
# ==========================================================

class CreateMilestoneRequest(BaseModel):
    project_id: int
    title: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=10000)
    due_date: date


class UpdateMilestoneRequest(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=10000)
    due_date: date


class UpdateMilestoneStatusRequest(BaseModel):
    status: Literal["pending", "in_progress", "completed"]


# ==========================================================
# HELPER: CLEAN UP DATABASE CONNECTIONS
# ==========================================================

def close_database_resources(cursor=None, connection=None):
    if cursor:
        cursor.close()

    if connection:
        connection.close()


# ==========================================================
# FACULTY: GET PROJECTS ASSIGNED TO THE LOGGED-IN FACULTY
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
                p.status AS project_status,
                p.created_at
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
        print("Error retrieving faculty projects:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve assigned projects.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# FACULTY: CREATE A MILESTONE
# ==========================================================

@router.post("/")
def create_milestone(
    request: CreateMilestoneRequest,
    faculty_id: int = Depends(get_current_faculty_id),
):
    if request.due_date < date.today():
        raise HTTPException(
            status_code=422,
            detail="The milestone deadline cannot be in the past.",
        )

    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        # Only the faculty assigned to the project may create milestones.
        cursor.execute(
            """
            SELECT project_id, title
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
                    "You can create milestones only for projects "
                    "assigned to your faculty account."
                ),
            )

        cursor.execute(
            """
            INSERT INTO milestones (
                project_id,
                title,
                description,
                due_date,
                status
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                request.project_id,
                request.title.strip(),
                request.description.strip()
                if request.description
                else None,
                request.due_date,
                "pending",
            ),
        )

        milestone_id = cursor.lastrowid
        connection.commit()

        return {
            "message": "Milestone created successfully.",
            "milestone": {
                "milestone_id": milestone_id,
                "project_id": request.project_id,
                "project_title": project["title"],
                "title": request.title.strip(),
                "description": request.description.strip()
                if request.description
                else None,
                "due_date": request.due_date,
                "status": "pending",
            },
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as error:
        if connection:
            connection.rollback()

        print("Error creating milestone:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to create the milestone.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# FACULTY: GET MILESTONES FOR THEIR ASSIGNED PROJECTS
# ==========================================================

@router.get("/faculty")
def get_faculty_milestones(
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
                m.milestone_id,
                m.project_id,
                p.title AS project_title,
                p.student_id,
                s.name AS student_name,
                m.title,
                m.description,
                m.due_date,
                CASE
                    WHEN m.status <> 'completed'
                         AND m.due_date < CURDATE()
                    THEN 'overdue'
                    ELSE m.status
                END AS status,
                m.completed_at,
                m.created_at,
                m.updated_at
            FROM milestones m
            INNER JOIN projects p
                ON p.project_id = m.project_id
            INNER JOIN students s
                ON s.student_id = p.student_id
            WHERE p.assigned_faculty_id = %s
            ORDER BY
                CASE
                    WHEN m.status = 'completed' THEN 2
                    WHEN m.due_date < CURDATE() THEN 0
                    ELSE 1
                END,
                m.due_date ASC
            """,
            (faculty_id,),
        )

        milestones = cursor.fetchall()

        return {
            "count": len(milestones),
            "milestones": milestones,
        }

    except Exception as error:
        print("Error retrieving faculty milestones:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve milestones.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# FACULTY: UPDATE A MILESTONE
# ==========================================================

@router.put("/{milestone_id}")
def update_milestone(
    milestone_id: int,
    request: UpdateMilestoneRequest,
    faculty_id: int = Depends(get_current_faculty_id),
):
    if request.due_date < date.today():
        raise HTTPException(
            status_code=422,
            detail="The milestone deadline cannot be in the past.",
        )

    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT m.milestone_id
            FROM milestones m
            INNER JOIN projects p
                ON p.project_id = m.project_id
            WHERE m.milestone_id = %s
              AND p.assigned_faculty_id = %s
            """,
            (milestone_id, faculty_id),
        )

        milestone = cursor.fetchone()

        if not milestone:
            raise HTTPException(
                status_code=404,
                detail="Milestone not found for your assigned projects.",
            )

        cursor.execute(
            """
            UPDATE milestones
            SET
                title = %s,
                description = %s,
                due_date = %s
            WHERE milestone_id = %s
            """,
            (
                request.title.strip(),
                request.description.strip()
                if request.description
                else None,
                request.due_date,
                milestone_id,
            ),
        )

        connection.commit()

        return {
            "message": "Milestone updated successfully.",
            "milestone_id": milestone_id,
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as error:
        if connection:
            connection.rollback()

        print("Error updating milestone:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to update the milestone.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# FACULTY: DELETE A MILESTONE
# ==========================================================

@router.delete("/{milestone_id}")
def delete_milestone(
    milestone_id: int,
    faculty_id: int = Depends(get_current_faculty_id),
):
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT m.milestone_id
            FROM milestones m
            INNER JOIN projects p
                ON p.project_id = m.project_id
            WHERE m.milestone_id = %s
              AND p.assigned_faculty_id = %s
            """,
            (milestone_id, faculty_id),
        )

        milestone = cursor.fetchone()

        if not milestone:
            raise HTTPException(
                status_code=404,
                detail="Milestone not found for your assigned projects.",
            )

        cursor.execute(
            """
            DELETE FROM milestones
            WHERE milestone_id = %s
            """,
            (milestone_id,),
        )

        connection.commit()

        return {
            "message": "Milestone deleted successfully.",
            "milestone_id": milestone_id,
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as error:
        if connection:
            connection.rollback()

        print("Error deleting milestone:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to delete the milestone.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# STUDENT: GET MILESTONES FOR THEIR OWN PROJECTS
# ==========================================================

@router.get("/student")
def get_student_milestones(
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
                m.milestone_id,
                m.project_id,
                p.title AS project_title,
                m.title,
                m.description,
                m.due_date,
                CASE
                    WHEN m.status <> 'completed'
                         AND m.due_date < CURDATE()
                    THEN 'overdue'
                    ELSE m.status
                END AS status,
                m.completed_at,
                m.created_at,
                m.updated_at,
                f.name AS faculty_name
            FROM milestones m
            INNER JOIN projects p
                ON p.project_id = m.project_id
            LEFT JOIN faculty f
                ON f.faculty_id = p.assigned_faculty_id
            WHERE p.student_id = %s
            ORDER BY
                CASE
                    WHEN m.status = 'completed' THEN 2
                    WHEN m.due_date < CURDATE() THEN 0
                    ELSE 1
                END,
                m.due_date ASC
            """,
            (student_id,),
        )

        milestones = cursor.fetchall()

        return {
            "count": len(milestones),
            "milestones": milestones,
        }

    except Exception as error:
        print("Error retrieving student milestones:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve your milestones.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# STUDENT: UPDATE THEIR OWN MILESTONE PROGRESS
# ==========================================================

@router.patch("/{milestone_id}/status")
def update_student_milestone_status(
    milestone_id: int,
    request: UpdateMilestoneStatusRequest,
    student_id: int = Depends(get_current_student_id),
):
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        # Students can update progress only on their own projects.
        cursor.execute(
            """
            SELECT
                m.milestone_id,
                m.project_id,
                m.status
            FROM milestones m
            INNER JOIN projects p
                ON p.project_id = m.project_id
            WHERE m.milestone_id = %s
              AND p.student_id = %s
            """,
            (milestone_id, student_id),
        )

        milestone = cursor.fetchone()

        if not milestone:
            raise HTTPException(
                status_code=404,
                detail="Milestone not found in your projects.",
            )

        cursor.execute(
            """
            UPDATE milestones
            SET
                status = %s,
                completed_at = CASE
                    WHEN %s = 'completed'
                    THEN CURRENT_TIMESTAMP
                    ELSE NULL
                END
            WHERE milestone_id = %s
            """,
            (
                request.status,
                request.status,
                milestone_id,
            ),
        )

        connection.commit()

        return {
            "message": "Milestone progress updated successfully.",
            "milestone_id": milestone_id,
            "project_id": milestone["project_id"],
            "status": request.status,
        }

    except HTTPException:
        if connection:
            connection.rollback()
        raise

    except Exception as error:
        if connection:
            connection.rollback()

        print("Error updating student milestone:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to update milestone progress.",
        )

    finally:
        close_database_resources(cursor, connection)