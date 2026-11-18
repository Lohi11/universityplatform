from pydantic import BaseModel, Field


class CreateProjectRequest(BaseModel):

    title: str = Field(
        min_length=3,
        max_length=200
    )

    problem_statement: str = Field(
        min_length=10
    )

    objectives: str = Field(
        min_length=10
    )

    description: str = Field(
        min_length=10
    )

    technologies: str = Field(
        min_length=1,
        max_length=500
    )