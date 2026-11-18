USE university_project_db;

SELECT
    faculty_id,
    name,
    email,
    department,
    account_status
FROM faculty;

USE university_project_db;

INSERT INTO faculty (
    name,
    email,
    department,
    password_hash,
    account_status
)
VALUES (
    'Test Faculty',
    'faculty.test@srmist.edu.in',
    'Information Technology',
    'TEST_ONLY_NOT_A_REAL_PASSWORD_HASH',
    'active'
);

USE university_project_db;

ALTER TABLE faculty
    ADD COLUMN designation VARCHAR(100) NULL,
    ADD COLUMN specialization VARCHAR(255) NULL,
    ADD COLUMN research_interests TEXT NULL,
    ADD COLUMN accepting_requests TINYINT(1) NOT NULL DEFAULT 1;

UPDATE faculty
SET
    designation = 'Assistant Professor',
    specialization = 'Data Engineering, Big Data',
    research_interests = 'ETL pipelines, Apache Spark, data quality',
    accepting_requests = 1
WHERE faculty_id = 1;

select *from faculty;


USE university_project_db;

UPDATE faculty
SET password_hash = '$argon2id$v=19$m=65536,t=3,p=4$LklBDcflpPOvYIS8EMGM8g$MCotp/p5IJjk9xHkHcShT7I5OafC568pjvaYhFw3cJ0'
WHERE faculty_id = 1;



USE university_project_db;

SELECT *
FROM students;


SELECT
    s.student_id,
    s.email,
    p.project_id,
    p.title AS project_title,
    p.status AS project_status
FROM students AS s
LEFT JOIN projects AS p
    ON s.student_id = p.student_id
ORDER BY s.student_id, p.project_id;