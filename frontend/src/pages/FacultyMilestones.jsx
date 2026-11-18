import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  GraduationCap,
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react'

import API_BASE_URL from '../api'
import './FacultyMilestones.css'

function getLocalDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
  }

  return labels[String(status || '').toLowerCase()] || status
}

function getFacultySession() {
  const savedSession =
    localStorage.getItem('university_faculty_auth') ||
    sessionStorage.getItem('university_faculty_auth')

  if (!savedSession) {
    throw new Error('Your faculty session is missing. Please log in again.')
  }

  let authData

  try {
    authData = JSON.parse(savedSession)
  } catch {
    throw new Error('Your faculty session is invalid. Please log in again.')
  }

  if (!authData?.access_token || !authData?.faculty) {
    throw new Error('Your faculty login information is incomplete.')
  }

  return authData
}

async function readResponse(response) {
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your faculty session expired. Please log in again.')
    }

    throw new Error(
      result.detail || 'The request could not be completed.'
    )
  }

  return result
}

function FacultyMilestones() {
  const navigate = useNavigate()

  const [faculty, setFaculty] = useState(null)
  const [projects, setProjects] = useState([])
  const [milestones, setMilestones] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState({ type: '', text: '' })
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    project_id: '',
    title: '',
    description: '',
    due_date: '',
  })

  const [formError, setFormError] = useState('')

  const isEditing = editingId !== null

  const resetForm = () => {
    setEditingId(null)
    setForm({
      project_id: '',
      title: '',
      description: '',
      due_date: '',
    })
    setFormError('')
  }

  // Retrieve assigned projects and their milestones.
  const loadData = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setIsRefreshing(true)
      setErrorMessage('')
    }

    try {
      const authData = getFacultySession()
      const token = authData.access_token

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      }

      const [projectResponse, milestoneResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/milestones/faculty/projects`, {
          headers,
        }),
        fetch(`${API_BASE_URL}/milestones/faculty`, {
          headers,
        }),
      ])

      if (
        projectResponse.status === 401 ||
        milestoneResponse.status === 401
      ) {
        localStorage.removeItem('university_faculty_auth')
        sessionStorage.removeItem('university_faculty_auth')

        navigate('/faculty/login', { replace: true })
        return
      }

      const projectData = await readResponse(projectResponse)
      const milestoneData = await readResponse(milestoneResponse)

      setFaculty(authData.faculty)

      setProjects(
        Array.isArray(projectData.projects)
          ? projectData.projects
          : []
      )

      setMilestones(
        Array.isArray(milestoneData.milestones)
          ? milestoneData.milestones
          : []
      )

      setErrorMessage('')
    } catch (error) {
      console.error('Faculty milestones loading error:', error)

      setErrorMessage(
        error.message || 'Unable to load milestones.'
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stats = useMemo(() => ({
    total: milestones.length,

    pending: milestones.filter(
      (item) => item.status === 'pending'
    ).length,

    inProgress: milestones.filter(
      (item) => item.status === 'in_progress'
    ).length,

    completed: milestones.filter(
      (item) => item.status === 'completed'
    ).length,

    overdue: milestones.filter(
      (item) => item.status === 'overdue'
    ).length,
  }), [milestones])

  const filteredMilestones = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    return milestones.filter((item) => {
      const statusMatches =
        statusFilter === 'all' || item.status === statusFilter

      const searchMatches = !query || [
        item.title,
        item.description,
        item.project_title,
        item.student_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)

      return statusMatches && searchMatches
    })
  }, [milestones, searchText, statusFilter])

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))

    setFormError('')
  }

  const startEditing = (milestone) => {
    setEditingId(milestone.milestone_id)

    setForm({
      project_id: String(milestone.project_id),
      title: milestone.title || '',
      description: milestone.description || '',
      due_date: String(milestone.due_date || '').slice(0, 10),
    })

    setFormError('')
    setNotice({ type: '', text: '' })

    document
      .getElementById('faculty-milestone-form')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
  }

  // Create a new milestone or update an existing one.
  const handleSubmit = async (event) => {
    event.preventDefault()

    setFormError('')
    setNotice({ type: '', text: '' })

    if (!isEditing && !form.project_id) {
      setFormError('Please select an assigned project.')
      return
    }

    if (form.title.trim().length < 3) {
      setFormError('Enter a milestone title with at least 3 characters.')
      return
    }

    if (!form.due_date) {
      setFormError('Please select a deadline.')
      return
    }

    if (form.due_date < getLocalDateString()) {
      setFormError('The deadline cannot be in the past.')
      return
    }

    setIsSaving(true)

    try {
      const authData = getFacultySession()

      const url = isEditing
        ? `${API_BASE_URL}/milestones/${editingId}`
        : `${API_BASE_URL}/milestones/`

      const method = isEditing ? 'PUT' : 'POST'

      const body = isEditing
        ? {
            title: form.title.trim(),
            description: form.description.trim() || null,
            due_date: form.due_date,
          }
        : {
            project_id: Number(form.project_id),
            title: form.title.trim(),
            description: form.description.trim() || null,
            due_date: form.due_date,
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.access_token}`,
        },
        body: JSON.stringify(body),
      })

      const result = await readResponse(response)

      setNotice({
        type: 'success',
        text: result.message || (
          isEditing
            ? 'Milestone updated successfully.'
            : 'Milestone created successfully.'
        ),
      })

      resetForm()
      await loadData()
    } catch (error) {
      console.error('Saving milestone failed:', error)

      setFormError(
        error.message || 'Unable to save the milestone.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Delete a milestone after confirmation.
  const handleDelete = async (milestone) => {
    const confirmed = window.confirm(
      `Delete "${milestone.title}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    setDeletingId(milestone.milestone_id)
    setNotice({ type: '', text: '' })

    try {
      const authData = getFacultySession()

      const response = await fetch(
        `${API_BASE_URL}/milestones/${milestone.milestone_id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
          },
        }
      )

      const result = await readResponse(response)

      setMilestones((previous) =>
        previous.filter(
          (item) => item.milestone_id !== milestone.milestone_id
        )
      )

      setNotice({
        type: 'success',
        text: result.message || 'Milestone deleted successfully.',
      })

      if (editingId === milestone.milestone_id) {
        resetForm()
      }
    } catch (error) {
      console.error('Deleting milestone failed:', error)

      setNotice({
        type: 'error',
        text: error.message || 'Unable to delete this milestone.',
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <main className="faculty-milestones-page">
        <div className="faculty-milestones-loading">
          <RefreshCw size={25} className="faculty-milestone-spin" />
          <h2>Loading milestone workspace</h2>
          <p>Retrieving assigned projects and deadlines...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="faculty-milestones-page">

      {/* Header */}
      <header className="faculty-milestones-header">
        <div className="faculty-milestones-brand">
          <span className="faculty-milestones-brand-icon">
            <GraduationCap size={22} />
          </span>

          <span>
            University<span>Project</span>
          </span>
        </div>

        <div className="faculty-milestones-header-actions">
          <span className="faculty-milestones-user">
            {faculty?.name || 'Faculty'}
          </span>

          <Link
            to="/faculty/dashboard"
            className="faculty-milestones-back"
          >
            <ArrowLeft size={16} />
            Faculty Dashboard
          </Link>
        </div>
      </header>

      <div className="faculty-milestones-content">

        {/* Heading */}
        <section className="faculty-milestones-page-heading">
          <div>
            <span className="faculty-milestones-eyebrow">
              PROJECT SUPERVISION
            </span>

            <h1>Milestones Management</h1>

            <p>
              Create project tasks, set deadlines and monitor student progress.
            </p>
          </div>

          <button
            type="button"
            className="faculty-milestones-refresh"
            onClick={() => loadData(true)}
            disabled={
              isRefreshing ||
              isSaving ||
              deletingId !== null
            }
          >
            <RefreshCw
              size={16}
              className={
                isRefreshing ? 'faculty-milestone-spin' : ''
              }
            />

            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </section>

        {/* Loading errors */}
        {errorMessage && (
          <div className="faculty-milestones-notice error" role="alert">
            <AlertCircle size={18} />

            <div>
              <strong>Unable to load data</strong>
              <p>{errorMessage}</p>

              <button
                type="button"
                onClick={() => loadData(true)}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Action notices */}
        {notice.text && (
          <div
            className={`faculty-milestones-notice ${notice.type}`}
            role={notice.type === 'error' ? 'alert' : 'status'}
          >
            {notice.type === 'success'
              ? <CheckCircle2 size={18} />
              : <AlertCircle size={18} />}

            <p>{notice.text}</p>
          </div>
        )}

        {!errorMessage && (
          <>
            {/* Statistics */}
            <section className="faculty-milestones-stats">

              <article>
                <div className="faculty-milestone-stat-icon total">
                  <ListTodo size={20} />
                </div>

                <span>Total milestones</span>
                <strong>{stats.total}</strong>
              </article>

              <article>
                <div className="faculty-milestone-stat-icon pending">
                  <Clock3 size={20} />
                </div>

                <span>Pending</span>
                <strong>{stats.pending}</strong>
              </article>

              <article>
                <div className="faculty-milestone-stat-icon progress">
                  <RefreshCw size={20} />
                </div>

                <span>In progress</span>
                <strong>{stats.inProgress}</strong>
              </article>

              <article>
                <div className="faculty-milestone-stat-icon completed">
                  <CheckCircle2 size={20} />
                </div>

                <span>Completed</span>
                <strong>{stats.completed}</strong>
              </article>

            </section>

            {/* Create/Edit form */}
            <section
              className="faculty-milestone-form-card"
              id="faculty-milestone-form"
            >
              <div className="faculty-milestone-section-heading">
                <div className="faculty-milestone-form-icon">
                  {isEditing ? <Edit3 size={22} /> : <Plus size={22} />}
                </div>

                <div>
                  <span className="faculty-milestones-eyebrow">
                    {isEditing ? 'UPDATE EXISTING TASK' : 'CREATE NEW TASK'}
                  </span>

                  <h2>
                    {isEditing ? 'Edit milestone' : 'Create a milestone'}
                  </h2>

                  <p>
                    {isEditing
                      ? 'Update the title, description or deadline.'
                      : 'Choose an assigned project and define its deadline.'}
                  </p>
                </div>
              </div>

              {projects.length === 0 && !isEditing && (
                <div className="faculty-milestones-project-warning">
                  No projects are assigned to this faculty account yet.
                  A project must be assigned before milestones can be created.
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="faculty-milestone-form"
              >
                <div className="faculty-milestone-form-field full">
                  <label htmlFor="milestone-project">
                    Assigned project
                  </label>

                  <select
                    id="milestone-project"
                    value={form.project_id}
                    onChange={(event) =>
                      updateField('project_id', event.target.value)
                    }
                    required={!isEditing}
                    disabled={
                      isEditing ||
                      isSaving ||
                      projects.length === 0
                    }
                  >
                    <option value="">Select an assigned project</option>

                    {projects.map((project) => (
                      <option
                        key={project.project_id}
                        value={project.project_id}
                      >
                        #{project.project_id} — {project.title}
                        {project.student_name
                          ? ` (${project.student_name})`
                          : ''}
                      </option>
                    ))}
                  </select>

                  {isEditing && (
                    <span className="faculty-milestone-field-help">
                      The project cannot be changed while editing a milestone.
                    </span>
                  )}
                </div>

                <div className="faculty-milestone-form-field full">
                  <label htmlFor="milestone-title">
                    Milestone title
                  </label>

                  <input
                    id="milestone-title"
                    type="text"
                    maxLength={150}
                    value={form.title}
                    onChange={(event) =>
                      updateField('title', event.target.value)
                    }
                    placeholder="e.g. Literature Review"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="faculty-milestone-form-field full">
                  <label htmlFor="milestone-description">
                    Description <span>(optional)</span>
                  </label>

                  <textarea
                    id="milestone-description"
                    rows={4}
                    maxLength={10000}
                    value={form.description}
                    onChange={(event) =>
                      updateField('description', event.target.value)
                    }
                    placeholder="Explain what the student needs to complete..."
                    disabled={isSaving}
                  />
                </div>

                <div className="faculty-milestone-form-field">
                  <label htmlFor="milestone-deadline">
                    Deadline
                  </label>

                  <input
                    id="milestone-deadline"
                    type="date"
                    min={getLocalDateString()}
                    value={form.due_date}
                    onChange={(event) =>
                      updateField('due_date', event.target.value)
                    }
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="faculty-milestone-form-actions">
                  {isEditing && (
                    <button
                      type="button"
                      className="faculty-milestone-cancel"
                      onClick={resetForm}
                      disabled={isSaving}
                    >
                      <X size={16} />
                      Cancel edit
                    </button>
                  )}

                  <button
                    type="submit"
                    className="faculty-milestone-submit"
                    disabled={
                      isSaving ||
                      (!isEditing && projects.length === 0)
                    }
                  >
                    {isSaving
                      ? 'Saving...'
                      : isEditing
                        ? 'Save Changes'
                        : 'Create Milestone'}

                    {!isSaving && <Plus size={17} />}
                  </button>
                </div>

                {formError && (
                  <div
                    className="faculty-milestone-form-error"
                    role="alert"
                  >
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}
              </form>
            </section>

            {/* Existing milestones */}
            <section className="faculty-milestone-list-section">
              <div className="faculty-milestone-list-heading">
                <div>
                  <span className="faculty-milestones-eyebrow">
                    ASSIGNED PROJECTS
                  </span>

                  <h2>Manage milestones</h2>

                  <p>
                    Review deadlines and modify milestones for your assigned projects.
                  </p>
                </div>

                <span className="faculty-milestone-total">
                  {milestones.length} total
                </span>
              </div>

              {/* Search and filters */}
              <div className="faculty-milestone-controls">
                <div className="faculty-milestone-search">
                  <Search size={17} />

                  <input
                    type="search"
                    value={searchText}
                    onChange={(event) =>
                      setSearchText(event.target.value)
                    }
                    placeholder="Search by title, project or student..."
                    aria-label="Search milestones"
                  />
                </div>

                <div className="faculty-milestone-filters">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Overdue', value: 'overdue' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      className={
                        statusFilter === filter.value
                          ? 'faculty-milestone-filter active'
                          : 'faculty-milestone-filter'
                      }
                      onClick={() => setStatusFilter(filter.value)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMilestones.length === 0 ? (
                <div className="faculty-milestone-empty">
                  <div className="faculty-milestone-empty-icon">
                    <CalendarDays size={27} />
                  </div>

                  <h3>
                    {milestones.length === 0
                      ? 'No milestones created yet'
                      : 'No matching milestones'}
                  </h3>

                  <p>
                    {milestones.length === 0
                      ? 'Create a milestone above. Students will see it in their portal.'
                      : 'Try another search term or status filter.'}
                  </p>

                  {milestones.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchText('')
                        setStatusFilter('all')
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="faculty-milestone-cards">
                  {filteredMilestones.map((milestone) => (
                    <article
                      className="faculty-milestone-card"
                      key={milestone.milestone_id}
                    >
                      <div className="faculty-milestone-card-top">
                        <div className="faculty-milestone-card-icon">
                          <CalendarDays size={21} />
                        </div>

                        <span
                          className={`faculty-milestone-status status-${milestone.status}`}
                        >
                          {getStatusLabel(milestone.status)}
                        </span>
                      </div>

                      <span className="faculty-milestone-project-name">
                        Project #{milestone.project_id} · {milestone.project_title}
                      </span>

                      <h3>{milestone.title}</h3>

                      <p className="faculty-milestone-card-description">
                        {milestone.description ||
                          'No additional description provided.'}
                      </p>

                      <div className="faculty-milestone-card-details">
                        <div>
                          <CalendarDays size={16} />
                          <span>
                            <small>Deadline</small>
                            <strong>{formatDate(milestone.due_date)}</strong>
                          </span>
                        </div>

                        <div>
                          <GraduationCap size={16} />
                          <span>
                            <small>Student</small>
                            <strong>
                              {milestone.student_name || 'Assigned student'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {milestone.completed_at && (
                        <div className="faculty-milestone-completion">
                          <CheckCircle2 size={15} />
                          Completed {formatDate(milestone.completed_at)}
                        </div>
                      )}

                      <div className="faculty-milestone-card-actions">
                        <button
                          type="button"
                          className="faculty-milestone-edit"
                          onClick={() => startEditing(milestone)}
                          disabled={
                            isSaving ||
                            deletingId === milestone.milestone_id
                          }
                        >
                          <Edit3 size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="faculty-milestone-delete"
                          onClick={() => handleDelete(milestone)}
                          disabled={
                            isSaving ||
                            deletingId === milestone.milestone_id
                          }
                        >
                          <Trash2 size={15} />
                          {deletingId === milestone.milestone_id
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

export default FacultyMilestones