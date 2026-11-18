import { useCallback, useEffect, useState } from 'react'

import {
  FolderKanban,
  Plus,
  ArrowRight,
  GraduationCap,
  CalendarDays,
  FileText,
  MessageSquare,
  RefreshCw,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import API_BASE_URL from '../api'
import './StudentProject.css'

function formatDate(dateValue) {
  if (!dateValue) return 'Date unavailable'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatStatus(status) {
  if (!status) return 'Draft'

  return status
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function StudentProject() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProjects = useCallback(async (manualRefresh = false) => {
  if (manualRefresh) {
    setIsLoading(true)
    setError('')
  }


    try {
      const savedSession =
        localStorage.getItem('university_project_auth') ||
        sessionStorage.getItem('university_project_auth')

      if (!savedSession) {
        setError('Your login session is missing. Please log in again.')
        return
      }

      let authData

      try {
        authData = JSON.parse(savedSession)
      } catch {
        setError('Your login session is invalid. Please log in again.')
        return
      }

      if (!authData?.access_token) {
        setError('Your authentication token is missing. Please log in again.')
        return
      }

      const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          Accept: 'application/json',
        },
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.')
        } else {
          setError(
            typeof result.detail === 'string'
              ? result.detail
              : 'Unable to load your projects. Please try again.'
          )
        }

        return
      }

      setProjects(
        Array.isArray(result.projects)
          ? result.projects
          : []
      )
    } catch (requestError) {
      console.error('Unable to load projects:', requestError)

      setError(
        'Could not connect to the backend. Please check that FastAPI is running.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const hasProjects = projects.length > 0

  return (
    <div className="project-page">

      {/* Page Header */}
      <header className="project-header">
        <div className="project-header-content">
          <span className="project-eyebrow">
            PROJECT WORKSPACE
          </span>

          <h1>My Project</h1>

          <p>
            Manage your project details, faculty guidance,
            milestones, documents and feedback from one place.
          </p>
        </div>

        <Link
          to="/student/project/create"
          className="project-create-button"
        >
          <Plus size={18} strokeWidth={2.2} />
          Create Project
        </Link>
      </header>

      {/* Loading State */}
      {isLoading && (
        <section className="project-message-state" aria-live="polite">
          <RefreshCw size={22} className="project-loading-icon" />

          <h2>Loading your projects</h2>

          <p>Fetching your saved projects from the database...</p>
        </section>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <section
          className="project-message-state project-error-state"
          role="alert"
        >
          <h2>Unable to load projects</h2>

          <p>{error}</p>

          <button
            type="button"
            className="project-retry-button"
            onClick={() => loadProjects(true)}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </section>
      )}

      {/* Empty Project State */}
      {!isLoading && !error && !hasProjects && (
        <section className="project-empty-state">

          <div className="project-empty-visual">

            <div className="project-empty-glow"></div>

            <div className="project-empty-icon">
              <FolderKanban
                size={38}
                strokeWidth={1.8}
              />
            </div>

            <div className="empty-floating-icon icon-one">
              <GraduationCap
                size={18}
                strokeWidth={2}
              />
            </div>

            <div className="empty-floating-icon icon-two">
              <FileText
                size={18}
                strokeWidth={2}
              />
            </div>

            <div className="empty-floating-icon icon-three">
              <CalendarDays
                size={18}
                strokeWidth={2}
              />
            </div>

          </div>

          <div className="project-empty-content">

            <span className="empty-label">
              GET STARTED
            </span>

            <h2>
              Your project workspace is ready.
            </h2>

            <p>
              Create your university project to start managing
              faculty guidance, milestones, documents and
              feedback from one central workspace.
            </p>

            <Link
              to="/student/project/create"
              className="project-primary-button"
            >
              <Plus size={18} strokeWidth={2.2} />

              <span>Create Your Project</span>

              <ArrowRight size={17} strokeWidth={2.2} />
            </Link>

          </div>

        </section>
      )}

      {/* Saved Projects */}
      {!isLoading && !error && hasProjects && (
        <section className="saved-projects-section">

          <div className="saved-projects-header">
            <div>
              <span className="section-label">
                YOUR WORKSPACE
              </span>

              <h2>Your saved projects</h2>

              <p>
                {projects.length === 1
                  ? '1 project found in your account.'
                  : `${projects.length} projects found in your account.`}
              </p>
            </div>

            <button
              type="button"
              className="project-refresh-button"
              onClick={loadProjects}
              disabled={isLoading}
              aria-label="Refresh projects"
              title="Refresh projects"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          <div className="saved-projects-grid">

            {projects.map((project) => {
              const technologies = (
                project.technologies || ''
              )
                .split(',')
                .map((technology) => technology.trim())
                .filter(Boolean)

              return (
                <article
                  className="saved-project-card"
                  key={project.project_id}
                >

                  <div className="saved-project-top">
                    <span className="saved-project-id">
                      <FolderKanban size={15} />
                      PROJECT #{project.project_id}
                    </span>

                    <span
                      className={`saved-project-status status-${(
                        project.status || 'draft'
                      )
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')}`}
                    >
                      {formatStatus(project.status)}
                    </span>
                  </div>

                  <h3 className="saved-project-title">
                    {project.title}
                  </h3>

                  <div className="saved-project-detail">
                    <span className="saved-project-label">
                      PROBLEM STATEMENT
                    </span>

                    <p>
                      {project.problem_statement ||
                        'No problem statement provided.'}
                    </p>
                  </div>

                  <div className="saved-project-detail">
                    <span className="saved-project-label">
                      OBJECTIVES
                    </span>

                    <p>
                      {project.objectives ||
                        'No objectives provided.'}
                    </p>
                  </div>

                  <div className="saved-project-technologies">
                    <span className="saved-project-label">
                      TECHNOLOGIES
                    </span>

                    {technologies.length > 0 ? (
                      <div className="saved-technology-list">
                        {technologies.map((technology, index) => (
                          <span
                            className="saved-technology-chip"
                            key={`${project.project_id}-${technology}-${index}`}
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p>No technologies added.</p>
                    )}
                  </div>

                  <div className="saved-project-footer">
                    <span>
                      Created {formatDate(project.created_at)}
                    </span>
                  </div>

                </article>
              )
            })}

          </div>
        </section>
      )}

      {/* Workspace Preview */}
      <section className="workspace-preview">

        <div className="workspace-preview-header">
          <div>
            <span className="section-label">
              PROJECT WORKFLOW
            </span>

            <h2>
              Everything connected in one workspace
            </h2>
          </div>
        </div>

        <div className="workspace-grid">

          {/* Guidance */}
          <Link
            to="/student/guidance"
            className="workspace-card workspace-card-link"
          >
            <div className="workspace-card-icon purple">
              <GraduationCap size={20} strokeWidth={2} />
            </div>

            <div className="workspace-card-content">
              <span>GUIDANCE</span>

              <h3>Faculty Guidance</h3>

              <p>
                Request and manage faculty guidance for your project.
              </p>
            </div>

            <div className="workspace-card-arrow">
              <ArrowRight size={17} />
            </div>
          </Link>

          {/* Milestones */}
          <Link
            to="/student/milestones"
            className="workspace-card workspace-card-link"
          >
            <div className="workspace-card-icon orange">
              <CalendarDays size={20} strokeWidth={2} />
            </div>

            <div className="workspace-card-content">
              <span>PROGRESS</span>

              <h3>Milestones</h3>

              <p>
                Track deadlines and project milestones assigned by faculty.
              </p>
            </div>

            <div className="workspace-card-arrow">
              <ArrowRight size={17} />
            </div>
          </Link>

          {/* Documents */}
          <Link
            to="/student/documents"
            className="workspace-card workspace-card-link"
          >
            <div className="workspace-card-icon blue">
              <FileText size={20} strokeWidth={2} />
            </div>

            <div className="workspace-card-content">
              <span>SUBMISSIONS</span>

              <h3>Documents</h3>

              <p>
                Upload and manage your project documents.
              </p>
            </div>

            <div className="workspace-card-arrow">
              <ArrowRight size={17} />
            </div>
          </Link>

          {/* Feedback */}
          <Link
            to="/student/feedback"
            className="workspace-card workspace-card-link"
          >
            <div className="workspace-card-icon green">
              <MessageSquare size={20} strokeWidth={2} />
            </div>

            <div className="workspace-card-content">
              <span>REVIEW</span>

              <h3>Faculty Feedback</h3>

              <p>
                View corrections and feedback provided by faculty.
              </p>
            </div>

            <div className="workspace-card-arrow">
              <ArrowRight size={17} />
            </div>
          </Link>

        </div>
      </section>

    </div>
  )
}

export default StudentProject