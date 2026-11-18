import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import API_BASE_URL from '../api'
import './FacultyFeedback.css'


function getFacultySession() {
  const savedSession =
    localStorage.getItem('university_faculty_auth') ||
    sessionStorage.getItem('university_faculty_auth')

  if (!savedSession) {
    throw new Error('Please log in to manage feedback.')
  }

  let session

  try {
    session = JSON.parse(savedSession)
  } catch {
    throw new Error('Your faculty session is invalid.')
  }

  if (!session?.access_token) {
    throw new Error('Faculty authentication token is missing.')
  }

  return session
}


async function readResponse(response) {
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your faculty session has expired. Please log in again.')
    }

    throw new Error(
      result.detail || 'Unable to complete the request.'
    )
  }

  return result
}


function formatDate(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}


function FacultyFeedback() {

  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [feedbackItems, setFeedbackItems] = useState([])

  const [selectedProject, setSelectedProject] = useState('')
  const [comment, setComment] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingId, setProcessingId] = useState(null)

  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState({
    type: '',
    text: '',
  })


  // Load assigned projects and feedback records.
  const loadData = useCallback(async (manualRefresh = false) => {

    if (manualRefresh) {
      setIsRefreshing(true)
      setErrorMessage('')
    }

    try {
      const session = getFacultySession()

      const headers = {
        Authorization: `Bearer ${session.access_token}`,
        Accept: 'application/json',
      }

      const [projectResponse, feedbackResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/feedback/faculty/projects`, {
          headers,
        }),

        fetch(`${API_BASE_URL}/feedback/faculty`, {
          headers,
        }),
      ])

      if (
        projectResponse.status === 401 ||
        feedbackResponse.status === 401
      ) {
        localStorage.removeItem('university_faculty_auth')
        sessionStorage.removeItem('university_faculty_auth')

        navigate('/faculty/login', { replace: true })
        return
      }

      const [projectData, feedbackData] = await Promise.all([
        readResponse(projectResponse),
        readResponse(feedbackResponse),
      ])

      const projectList = Array.isArray(projectData.projects)
        ? projectData.projects
        : []

      setProjects(projectList)

      setFeedbackItems(
        Array.isArray(feedbackData.feedback)
          ? feedbackData.feedback
          : []
      )

      setSelectedProject((current) => {
        const stillExists = projectList.some(
          (item) => String(item.project_id) === current
        )

        return stillExists
          ? current
          : projectList.length
            ? String(projectList[0].project_id)
            : ''
      })

      setErrorMessage('')

    } catch (error) {
      console.error('Faculty feedback loading failed:', error)

      setErrorMessage(
        error.message || 'Unable to load faculty feedback.'
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
    total: feedbackItems.length,

    open: feedbackItems.filter(
      (item) => item.status === 'open'
    ).length,

    resolved: feedbackItems.filter(
      (item) => item.status === 'resolved'
    ).length,

    waitingForStudent: feedbackItems.filter(
      (item) =>
        item.status === 'open' &&
        !item.student_response
    ).length,

  }), [feedbackItems])


  const filteredFeedback = useMemo(() => {

    const query = searchText.trim().toLowerCase()

    return feedbackItems.filter((item) => {

      const matchesFilter =
        activeFilter === 'all' ||
        item.status === activeFilter

      const searchableText = [
        item.project_title,
        item.student_name,
        item.comment,
        item.student_response,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query || searchableText.includes(query)

      return matchesFilter && matchesSearch

    })

  }, [feedbackItems, searchText, activeFilter])


  // Submit a new faculty comment.
  const handleCreateFeedback = async (event) => {

    event.preventDefault()

    setNotice({ type: '', text: '' })

    if (!selectedProject) {
      setNotice({
        type: 'error',
        text: 'Please select an assigned project.',
      })
      return
    }

    if (comment.trim().length < 3) {
      setNotice({
        type: 'error',
        text: 'Feedback must contain at least 3 characters.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const session = getFacultySession()

      const response = await fetch(
        `${API_BASE_URL}/feedback/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            project_id: Number(selectedProject),
            comment: comment.trim(),
          }),
        }
      )

      const result = await readResponse(response)

      setComment('')

      setNotice({
        type: 'success',
        text: result.message || 'Feedback submitted successfully.',
      })

      await loadData()

    } catch (error) {
      console.error('Creating feedback failed:', error)

      setNotice({
        type: 'error',
        text: error.message || 'Unable to submit feedback.',
      })

    } finally {
      setIsSubmitting(false)
    }
  }


  // Resolve a feedback record after reviewing the student's response.
  const handleResolve = async (item) => {

    if (!item.student_response?.trim()) {
      setNotice({
        type: 'error',
        text: 'The student has not submitted a response yet.',
      })
      return
    }

    const confirmed = window.confirm(
      `Mark feedback #${item.feedback_id} as resolved?`
    )

    if (!confirmed) return

    setProcessingId(item.feedback_id)
    setNotice({ type: '', text: '' })

    try {
      const session = getFacultySession()

      const response = await fetch(
        `${API_BASE_URL}/feedback/${item.feedback_id}/resolve`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      const result = await readResponse(response)

      setFeedbackItems((previous) =>
        previous.map((feedback) =>
          feedback.feedback_id === item.feedback_id
            ? {
                ...feedback,
                status: 'resolved',
                resolved_at: new Date().toISOString(),
              }
            : feedback
        )
      )

      setNotice({
        type: 'success',
        text: result.message || 'Feedback resolved successfully.',
      })

    } catch (error) {
      console.error('Resolving feedback failed:', error)

      setNotice({
        type: 'error',
        text: error.message || 'Unable to resolve feedback.',
      })

    } finally {
      setProcessingId(null)
    }
  }


  if (isLoading) {
    return (
      <main className="faculty-feedback-page">

        <div className="faculty-feedback-loading">
          <RefreshCw size={25} className="faculty-feedback-spin" />

          <h2>Loading feedback workspace</h2>

          <p>Retrieving student feedback and responses...</p>
        </div>

      </main>
    )
  }


  return (
    <main className="faculty-feedback-page">

      {/* PAGE HEADING */}
      <header className="faculty-feedback-heading">

        <div>
          <span className="faculty-feedback-eyebrow">
            PROJECT SUPERVISION
          </span>

          <h1>Feedback Management</h1>

          <p>
            Review student work, provide corrections and manage
            feedback responses for your assigned projects.
          </p>
        </div>

        <button
          type="button"
          className="faculty-feedback-refresh"
          onClick={() => loadData(true)}
          disabled={isRefreshing || isSubmitting}
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? 'faculty-feedback-spin' : ''}
          />

          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>

      </header>


      {/* ERROR */}
      {errorMessage && (
        <div className="faculty-feedback-alert error" role="alert">

          <AlertCircle size={18} />

          <div>
            <strong>Unable to load feedback</strong>

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


      {/* SUCCESS / ERROR NOTICE */}
      {notice.text && (
        <div
          className={`faculty-feedback-alert ${notice.type}`}
          role={notice.type === 'error' ? 'alert' : 'status'}
        >

          {notice.type === 'success'
            ? <CheckCircle2 size={18} />
            : <AlertCircle size={18} />
          }

          <p>{notice.text}</p>

        </div>
      )}


      {!errorMessage && (
        <>

          {/* STATISTICS */}
          <section className="faculty-feedback-stats">

            <article>
              <div className="faculty-feedback-stat-icon total">
                <MessageSquare size={21} />
              </div>

              <span>Total feedback</span>
              <strong>{stats.total}</strong>
            </article>

            <article>
              <div className="faculty-feedback-stat-icon open">
                <Clock3 size={21} />
              </div>

              <span>Open feedback</span>
              <strong>{stats.open}</strong>
            </article>

            <article>
              <div className="faculty-feedback-stat-icon waiting">
                <GraduationCap size={21} />
              </div>

              <span>Waiting for student</span>
              <strong>{stats.waitingForStudent}</strong>
            </article>

            <article>
              <div className="faculty-feedback-stat-icon resolved">
                <CheckCircle2 size={21} />
              </div>

              <span>Resolved</span>
              <strong>{stats.resolved}</strong>
            </article>

          </section>


          {/* CREATE FEEDBACK */}
          <section className="faculty-feedback-create-card">

            <div className="faculty-feedback-section-heading">

              <div className="faculty-feedback-create-icon">
                <Plus size={22} />
              </div>

              <div>
                <span className="faculty-feedback-eyebrow">
                  NEW REVIEW
                </span>

                <h2>Provide student feedback</h2>

                <p>
                  Select one of your assigned projects and enter
                  correction instructions for the student.
                </p>
              </div>

            </div>


            {projects.length === 0 ? (

              <div className="faculty-feedback-empty-projects">
                No projects are assigned to your faculty account yet.
              </div>

            ) : (

              <form
                className="faculty-feedback-form"
                onSubmit={handleCreateFeedback}
              >

                <div className="faculty-feedback-field">

                  <label htmlFor="faculty-feedback-project">
                    Assigned project
                  </label>

                  <select
                    id="faculty-feedback-project"
                    value={selectedProject}
                    onChange={(event) =>
                      setSelectedProject(event.target.value)
                    }
                    disabled={isSubmitting}
                    required
                  >

                    <option value="">
                      Select project
                    </option>

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

                </div>


                <div className="faculty-feedback-field">

                  <label htmlFor="faculty-feedback-comment">
                    Feedback and corrections
                  </label>

                  <textarea
                    id="faculty-feedback-comment"
                    rows={4}
                    maxLength={10000}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Write the improvements, corrections or instructions the student needs to follow..."
                    disabled={isSubmitting}
                    required
                  />

                  <div className="faculty-feedback-character-count">
                    {comment.length}/10000
                  </div>

                </div>


                <div className="faculty-feedback-form-actions">

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !selectedProject ||
                      comment.trim().length < 3
                    }
                  >

                    {isSubmitting
                      ? <RefreshCw size={17} className="faculty-feedback-spin" />
                      : <Send size={17} />
                    }

                    {isSubmitting
                      ? 'Submitting...'
                      : 'Send Feedback'
                    }

                  </button>

                </div>

              </form>

            )}

          </section>


          {/* FEEDBACK HISTORY */}
          <section className="faculty-feedback-history">

            <div className="faculty-feedback-history-heading">

              <div>
                <span className="faculty-feedback-eyebrow">
                  STUDENT RESPONSES
                </span>

                <h2>Feedback history</h2>

                <p>
                  Review feedback, student corrections and resolution status.
                </p>
              </div>

              <span className="faculty-feedback-count">
                {feedbackItems.length} records
              </span>

            </div>


            {/* SEARCH */}
            <div className="faculty-feedback-controls">

              <div className="faculty-feedback-search">

                <Search size={17} />

                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search project, student or feedback..."
                  aria-label="Search feedback"
                />

              </div>


              {/* FILTERS */}
              <div className="faculty-feedback-filters">

                {[
                  { label: 'All', value: 'all' },
                  { label: 'Open', value: 'open' },
                  { label: 'Resolved', value: 'resolved' },
                ].map((filter) => (

                  <button
                    key={filter.value}
                    type="button"
                    className={
                      activeFilter === filter.value
                        ? 'faculty-feedback-filter active'
                        : 'faculty-feedback-filter'
                    }
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    {filter.label}
                  </button>

                ))}

              </div>

            </div>


            {filteredFeedback.length === 0 ? (

              <div className="faculty-feedback-empty">

                <div className="faculty-feedback-empty-icon">
                  <MessageSquare size={28} />
                </div>

                <h3>
                  {feedbackItems.length === 0
                    ? 'No feedback submitted yet'
                    : 'No matching feedback'
                  }
                </h3>

                <p>
                  {feedbackItems.length === 0
                    ? 'Feedback submitted by you will appear here. Students will be able to view and respond to each comment.'
                    : 'Try another search or filter.'
                  }
                </p>

              </div>

            ) : (

              <div className="faculty-feedback-cards">

                {filteredFeedback.map((item) => {

                  const isResolved = item.status === 'resolved'

                  const isProcessing =
                    processingId === item.feedback_id

                  return (

                    <article
                      className="faculty-feedback-card"
                      key={item.feedback_id}
                    >

                      <div className="faculty-feedback-card-header">

                        <div>
                          <span className="faculty-feedback-project-name">
                            {item.project_title}
                          </span>

                          <h3>
                            Feedback #{item.feedback_id}
                          </h3>
                        </div>

                        <span className={`faculty-feedback-status ${
                          isResolved ? 'resolved' : 'open'
                        }`}>
                          {isResolved ? 'Resolved' : 'Open'}
                        </span>

                      </div>


                      <div className="faculty-feedback-student-info">

                        <GraduationCap size={17} />

                        <span>
                          Student: <strong>{item.student_name}</strong>
                          {' · '}
                          Project #{item.project_id}
                        </span>

                      </div>


                      {/* FACULTY COMMENT */}
                      <div className="faculty-feedback-comment">

                        <span>YOUR FEEDBACK</span>

                        <p>{item.comment}</p>

                      </div>


                      {/* STUDENT RESPONSE */}
                      <div className="faculty-feedback-student-response">

                        <span>STUDENT RESPONSE</span>

                        {item.student_response ? (
                          <p>{item.student_response}</p>
                        ) : (
                          <p className="waiting-response">
                            <Clock3 size={15} />
                            Waiting for the student to respond.
                          </p>
                        )}

                      </div>


                      <div className="faculty-feedback-meta">

                        <span>
                          <CalendarDays size={14} />
                          Submitted {formatDate(item.created_at)}
                        </span>

                        {item.resolved_at && (
                          <span>
                            Resolved {formatDate(item.resolved_at)}
                          </span>
                        )}

                      </div>


                      {/* RESOLVE BUTTON */}
                      {!isResolved && (

                        <div className="faculty-feedback-card-actions">

                          <button
                            type="button"
                            className="faculty-feedback-resolve-button"
                            onClick={() => handleResolve(item)}
                            disabled={
                              isProcessing ||
                              !item.student_response?.trim()
                            }
                            title={
                              !item.student_response
                                ? 'Waiting for student response'
                                : 'Mark feedback as resolved'
                            }
                          >

                            {isProcessing
                              ? <RefreshCw size={16} className="faculty-feedback-spin" />
                              : <CheckCircle2 size={17} />
                            }

                            {isProcessing
                              ? 'Resolving...'
                              : 'Mark as Resolved'
                            }

                          </button>

                        </div>

                      )}

                    </article>

                  )

                })}

              </div>

            )}

          </section>

        </>
      )}

    </main>
  )
}

export default FacultyFeedback