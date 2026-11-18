from pathlib import Path, PurePosixPath
from uuid import uuid4
import mimetypes

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse

from database import get_database_connection
from security import (
    get_current_student_id,
    get_current_faculty_id,
)


router = APIRouter(
    prefix="/documents",
    tags=["Document Management"],
)


# ==========================================================
# FILE STORAGE CONFIGURATION
# ==========================================================

BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]

UPLOAD_DIRECTORY = (
    BACKEND_DIRECTORY / "uploads" / "documents"
)

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".txt",
    ".csv",
    ".png",
    ".jpg",
    ".jpeg",
}


def close_database_resources(cursor=None, connection=None):
    if cursor:
        cursor.close()

    if connection:
        connection.close()


def get_stored_file_path(relative_path):
    """
    Resolve a stored relative path and make sure the result
    remains inside the document upload directory.
    """
    upload_root = UPLOAD_DIRECTORY.resolve()
    resolved_path = (
        BACKEND_DIRECTORY / relative_path
    ).resolve()

    if not resolved_path.is_relative_to(upload_root):
        raise HTTPException(
            status_code=500,
            detail="Invalid document storage path.",
        )

    return resolved_path


def get_document_record(document_id, ownership_column, owner_id):
    """
    Find a document only when its project belongs to the
    authenticated student or is assigned to the authenticated
    faculty member.

    ownership_column is selected only by server-side endpoint
    code, never from a user-supplied query parameter.
    """
    if ownership_column not in {
        "p.student_id",
        "p.assigned_faculty_id",
    }:
        raise ValueError("Invalid ownership column.")

    connection = None
    cursor = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            f"""
            SELECT
                d.document_id,
                d.project_id,
                d.uploaded_by,
                d.file_name,
                d.file_path,
                d.file_type,
                d.file_size,
                d.version_number,
                d.uploaded_at,
                p.title AS project_title
            FROM documents d
            INNER JOIN projects p
                ON p.project_id = d.project_id
            WHERE d.document_id = %s
              AND {ownership_column} = %s
            """,
            (document_id, owner_id),
        )

        return cursor.fetchone()

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# STUDENT: UPLOAD DOCUMENT
# ==========================================================

@router.post("/{project_id}/upload")
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    student_id: int = Depends(get_current_student_id),
):
    connection = None
    cursor = None
    saved_file_path = None

    try:
        original_name = PurePosixPath(
            (file.filename or "").replace("\\", "/")
        ).name.strip()

        if not original_name or original_name in {".", ".."}:
            raise HTTPException(
                status_code=400,
                detail="Please select a valid file.",
            )

        if len(original_name) > 255:
            raise HTTPException(
                status_code=400,
                detail="The filename must not exceed 255 characters.",
            )

        extension = Path(original_name).suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=415,
                detail=(
                    "Unsupported file format. Allowed formats: "
                    "PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, "
                    "CSV, PNG, JPG and JPEG."
                ),
            )

        # Read at most one byte beyond the permitted limit.
        contents = await file.read(MAX_FILE_SIZE + 1)

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="The selected file is empty.",
            )

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="The maximum permitted file size is 15 MB.",
            )

        connection = get_database_connection()
        cursor = connection.cursor(dictionary=True)

        # The student can upload only to their own project.
        # The row lock also helps serialize version creation
        # for uploads targeting the same project.
        cursor.execute(
            """
            SELECT project_id, title
            FROM projects
            WHERE project_id = %s
              AND student_id = %s
            FOR UPDATE
            """,
            (project_id, student_id),
        )

        project = cursor.fetchone()

        if not project:
            raise HTTPException(
                status_code=404,
                detail="Project not found in your account.",
            )

        # Each new upload of the same original filename
        # receives the next version number for that project.
        cursor.execute(
            """
            SELECT COALESCE(MAX(version_number), 0) + 1
                AS next_version
            FROM documents
            WHERE project_id = %s
              AND file_name = %s
            """,
            (project_id, original_name),
        )

        version_record = cursor.fetchone()
        version_number = version_record["next_version"]

        # Generate a server-owned filename. Never store the
        # supplied filename as a physical filesystem path.
        stored_filename = f"{uuid4().hex}{extension}"

        UPLOAD_DIRECTORY.mkdir(
            parents=True,
            exist_ok=True,
        )

        saved_file_path = (
            UPLOAD_DIRECTORY / stored_filename
        )

        with saved_file_path.open("xb") as destination:
            destination.write(contents)

        relative_path = (
            Path("uploads") / "documents" / stored_filename
        ).as_posix()

        content_type = (
            file.content_type
            or mimetypes.guess_type(original_name)[0]
            or "application/octet-stream"
        )

        cursor.execute(
            """
            INSERT INTO documents (
                project_id,
                uploaded_by,
                file_name,
                file_path,
                file_type,
                file_size,
                version_number
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                project_id,
                student_id,
                original_name,
                relative_path,
                content_type,
                len(contents),
                version_number,
            ),
        )

        document_id = cursor.lastrowid

        connection.commit()

        return {
            "message": "Document uploaded successfully.",
            "document": {
                "document_id": document_id,
                "project_id": project_id,
                "project_title": project["title"],
                "uploaded_by": student_id,
                "file_name": original_name,
                "file_type": content_type,
                "file_size": len(contents),
                "version_number": version_number,
            },
        }

    except HTTPException:
        if connection:
            connection.rollback()

        if saved_file_path and saved_file_path.exists():
            saved_file_path.unlink(missing_ok=True)

        raise

    except Exception as error:
        if connection:
            connection.rollback()

        if saved_file_path and saved_file_path.exists():
            saved_file_path.unlink(missing_ok=True)

        print("Document upload failed:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to upload the document.",
        )

    finally:
        close_database_resources(cursor, connection)
        await file.close()


# ==========================================================
# STUDENT: LIST DOCUMENTS FOR THEIR OWN PROJECTS
# ==========================================================

@router.get("/student")
def get_student_documents(
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
                d.document_id,
                d.project_id,
                p.title AS project_title,
                d.uploaded_by,
                d.file_name,
                d.file_type,
                d.file_size,
                d.version_number,
                d.uploaded_at
            FROM documents d
            INNER JOIN projects p
                ON p.project_id = d.project_id
            WHERE p.student_id = %s
            ORDER BY d.uploaded_at DESC, d.document_id DESC
            """,
            (student_id,),
        )

        documents = cursor.fetchall()

        return {
            "count": len(documents),
            "documents": documents,
        }

    except Exception as error:
        print("Student document retrieval failed:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve your documents.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# FACULTY: LIST DOCUMENTS FOR THEIR ASSIGNED PROJECTS
# ==========================================================

@router.get("/faculty")
def get_faculty_documents(
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
                d.document_id,
                d.project_id,
                p.title AS project_title,
                p.student_id,
                s.name AS student_name,
                d.uploaded_by,
                d.file_name,
                d.file_type,
                d.file_size,
                d.version_number,
                d.uploaded_at
            FROM documents d
            INNER JOIN projects p
                ON p.project_id = d.project_id
            INNER JOIN students s
                ON s.student_id = p.student_id
            WHERE p.assigned_faculty_id = %s
            ORDER BY d.uploaded_at DESC, d.document_id DESC
            """,
            (faculty_id,),
        )

        documents = cursor.fetchall()

        return {
            "count": len(documents),
            "documents": documents,
        }

    except Exception as error:
        print("Faculty document retrieval failed:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve documents for your projects.",
        )

    finally:
        close_database_resources(cursor, connection)


# ==========================================================
# STUDENT: DOWNLOAD A DOCUMENT FROM THEIR OWN PROJECT
# ==========================================================

@router.get("/student/{document_id}/download")
def download_student_document(
    document_id: int,
    student_id: int = Depends(get_current_student_id),
):
    document = get_document_record(
        document_id,
        "p.student_id",
        student_id,
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found in your projects.",
        )

    path = get_stored_file_path(document["file_path"])

    if not path.is_file():
        raise HTTPException(
            status_code=404,
            detail="The stored file could not be found.",
        )

    return FileResponse(
        path=path,
        filename=document["file_name"],
        media_type=document["file_type"],
    )


# ==========================================================
# FACULTY: DOWNLOAD A DOCUMENT FROM AN ASSIGNED PROJECT
# ==========================================================

@router.get("/faculty/{document_id}/download")
def download_faculty_document(
    document_id: int,
    faculty_id: int = Depends(get_current_faculty_id),
):
    document = get_document_record(
        document_id,
        "p.assigned_faculty_id",
        faculty_id,
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found in your assigned projects.",
        )

    path = get_stored_file_path(document["file_path"])

    if not path.is_file():
        raise HTTPException(
            status_code=404,
            detail="The stored file could not be found.",
        )

    return FileResponse(
        path=path,
        filename=document["file_name"],
        media_type=document["file_type"],
    )