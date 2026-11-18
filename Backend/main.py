from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from database import get_database_connection
from routers.auth import router as auth_router
from routers.projects import router as projects_router
from routers.guidance import router as guidance_router
from routers.faculty_auth import router as faculty_auth_router
from routers.milestones import router as milestones_router
from routers.documents import router as documents_router
from routers.feedback import router as feedback_router
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(guidance_router)
app.include_router(faculty_auth_router)
app.include_router(milestones_router)
app.include_router(documents_router)
app.include_router(feedback_router)
@app.get("/")
def home():
    return {"message": "University Project API is running"}


@app.get("/database-test")
def database_test():
    connection = get_database_connection()

    if connection.is_connected():
        connection.close()
        return {"message": "MySQL database connected successfully"}

    return {"message": "Database connection failed"}