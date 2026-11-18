from fastapi import APIRouter, Depends, HTTPException
from database import get_database_connection
from schemas.project import CreateProjectRequest
from security import get_current_student_id

router = APIRouter(prefix="/projects", tags=["Projects"])


# Get all projects belonging to the logged-in student
@router.get("/")
def get_my_projects(
    student_id: int = Depends(get_current_student_id)
):
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                project_id,
                title,
                problem_statement,
                objectives,
                description,
                technologies,
                status,
                assigned_faculty_id,
                created_at,
                updated_at
            FROM projects
            WHERE student_id = %s
            ORDER BY created_at DESC
        """

        cursor.execute(query, (student_id,))
        projects = cursor.fetchall()

        return {
            "count": len(projects),
            "projects": projects
        }

    except Exception as error:
        print("Error retrieving projects:", error)
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve your projects."
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# Create a new project
@router.post("/")
def create_project(
    project: CreateProjectRequest,
    student_id: int = Depends(get_current_student_id)
):
    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO projects (
                student_id,
                title,
                problem_statement,
                objectives,
                description,
                technologies
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        values = (
            student_id,
            project.title.strip(),
            project.problem_statement.strip(),
            project.objectives.strip(),
            project.description.strip(),
            project.technologies.strip(),
        )

        cursor.execute(query, values)
        project_id = cursor.lastrowid

        connection.commit()

        return {
            "message": "Project created successfully.",
            "project": {
                "project_id": project_id,
                "student_id": student_id,
                "title": project.title.strip(),
                "problem_statement": project.problem_statement.strip(),
                "objectives": project.objectives.strip(),
                "description": project.description.strip(),
                "technologies": project.technologies.strip(),
                "status": "draft"
            }
        }

    except Exception as error:
        if connection:
            connection.rollback()

        print("Error creating project:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to create your project."
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()