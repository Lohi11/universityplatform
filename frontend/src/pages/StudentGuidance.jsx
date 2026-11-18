import { useCallback, useEffect, useState } from 'react'

import {
  GraduationCap,
  UserRound,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import API_BASE_URL from '../api'
import './StudentGuidance.css'

function normalizeStatus(status) {
  return String(status || 'not-requested')
    .toLowerCase()
    .replaceAll('_', '-')
}

function formatStatus(status) {
  return String(status || 'not-requested')
    .replaceAll('_', ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getSavedSession() {
  const savedSession =
    localStorage.getItem('university_project_auth') ||
    sessionStorage.getItem('university_project_auth')

  if (!savedSession) {
    throw new Error('Your login session is missing. Please log in again.')
  }

  let authData

  try {
    authData = JSON.parse(savedSession)
  } catch {
    throw new Error('Your login session is invalid. Please log in again.')
  }

  if (!authData?.access_token) {
    throw new Error('Your login token is missing. Please log in again.')
  }

  return authData
}

function StudentGuidance() {
  const [projects, setProjects] = useState([])
  const [facultyMembers, setFacultyMembers] = useState([])
  const [requests, setRequests] = useState([])

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [requestMessage, setRequestMessage] = useState(
    'I would like your guidance for my project.'
  )

  const [isLoading, setIsLoading] = useState(true)
  const [submittingFacultyId, setSubmittingFacultyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState({
    type: '',
    text: '',
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const authData = getSavedSession()

      const headers = {
        Authorization: `Bearer ${authData.access_token}`,
        Accept: 'application/json',
      }

      const endpoints = [
        `${API_BASE_URL}/projects/`,
        `${API_BASE_URL}/guidance/faculty`,
        `${API_BASE_URL}/guidance/my-requests`,
      ]

      const responses = await Promise.all(
        endpoints.map((url) =>
          fetch(url, {
            method: 'GET',
            headers,
          })
        )
      )

      const results = await Promise.all(
        responses.map((response) =>
          response.json().catch(() => ({}))
        )
      )

      const failedIndex = responses.findIndex(
        (response) => !response.ok
      )

      if (failedIndex !== -1) {
        if (responses[failedIndex].status === 401) {
          throw new Error(
            'Your session has expired. Please log in again.'
          )
        }

        throw new Error(
          results[failedIndex]?.detail ||
            'Unable to load guidance information.'
        )
      }

      const projectList = Array.isArray(results[0]?.projects)
        ? results[0].projects
        : []

      const facultyList = Array.isArray(results[1]?.faculty)
        ? results[1].faculty
        : []

      const requestList = Array.isArray(results[2]?.requests)
        ? results[2].requests
        : []

      setProjects(projectList)
      setFacultyMembers(facultyList)
      setRequests(requestList)

      setSelectedProjectId((currentId) => {
        const currentProjectExists = projectList.some(
          (project) => String(project.project_id) === currentId
        )

        if (currentProjectExists) return currentId

        return projectList.length
          ? String(projectList[0].project_id)
          : ''
      })
    } catch (loadError) {
      console.error('Unable to load guidance information:', loadError)
      setError(
        loadError.message || 'Unable to load guidance information.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedProject = projects.find(
    (project) => String(project.project_id) === selectedProjectId
  )

  const selectedProjectRequest = requests.find(
    (request) =>
      String(request.project_id) === selectedProjectId
  )

  const requestStatus = selectedProjectRequest
    ? normalizeStatus(selectedProjectRequest.status)
    : 'not-requested'

  const hasActiveRequest = ['pending', 'accepted'].includes(
    requestStatus
  )

  const handleRequest = async (facultyId) => {
    setNotice({
      type: '',
      text: '',
    })

    if (!selectedProject) {
      setNotice({
        type: 'error',
        text: 'Please create a project before requesting faculty guidance.',
      })
      return
    }

    const message = requestMessage.trim()

    if (message.length < 3) {
      setNotice({
        type: 'error',
        text: 'Please enter a guidance message of at least 3 characters.',
      })
      return
    }

    if (message.length > 2000) {
      setNotice({
        type: 'error',
        text: 'Your guidance message cannot exceed 2000 characters.',
      })
      return
    }

    if (hasActiveRequest) {
      setNotice({
        type: 'error',
        text: 'This project already has a pending or accepted guidance request.',
      })
      return
    }

    const facultyMember = facultyMembers.find(
      (member) => String(member.faculty_id) === String(facultyId)
    )

    if (!facultyMember) {
      setNotice({
        type: 'error',
        text: 'Please select a valid faculty member.',
      })
      return
    }

    setSubmittingFacultyId(String(facultyId))

    try {
      const authData = getSavedSession()

      const response = await fetch(
        `${API_BASE_URL}/guidance/requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authData.access_token}`,
          },
          body: JSON.stringify({
            project_id: Number(selectedProjectId),
            faculty_id: Number(facultyId),
            message,
          }),
        }
      )

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Your session has expired. Please log in again.'
          )
        }

        throw new Error(
          result.detail || 'Unable to submit your guidance request.'
        )
      }

      const savedRequest = {
        ...result.request,
        project_title: selectedProject.title,
        faculty_name: facultyMember.name,
        faculty_department: facultyMember.department,
        requested_at: new Date().toISOString(),
        response_message: null,
        responded_at: null,
      }

      setRequests((previousRequests) => [
        savedRequest,
        ...previousRequests.filter(
          (request) =>
            request.request_id !== savedRequest.request_id
        ),
      ])

      setNotice({
        type: 'success',
        text: result.message || 'Guidance request submitted successfully.',
      })
    } catch (requestError) {
      console.error('Guidance request failed:', requestError)

      setNotice({
        type: 'error',
        text: requestError.message || 'Unable to submit the request.',
      })
    } finally {
      setSubmittingFacultyId('')
    }
  }

  return (
    <div className="guidance-page">

      {/* Header */}
      <header className="guidance-header">
        <div>
          <span className="guidance-eyebrow">
            FACULTY SUPPORT
          </span>

          <h1>Faculty Guidance</h1>

          <p>
            Explore faculty expertise, compare research interests,
            and request guidance for your university project.
          </p>
        </div>

        <div className="guidance-header-icon">
          <GraduationCap size={25} />
        </div>
      </header>

      {/* Faculty selection */}
      <section className="guidance-request-section">

        <div className="guidance-section-heading">
          <div>
            <span className="section-label">
              GUIDANCE REQUEST
            </span>

            <h2>Find your faculty mentor</h2>

            <p>
              Review each faculty member's expertise before selecting
              a guide for your project.
            </p>
          </div>

          <div className="request-security">
            <ShieldCheck size={16} />
            <span>Academic workspace</span>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="guidance-message-state" aria-live="polite">
            <RefreshCw size={20} />
            <p>Loading your projects and available faculty...</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div
            className="guidance-message-state guidance-error"
            role="alert"
          >
            <p>{error}</p>

            <button
              type="button"
              className="guidance-retry-button"
              onClick={loadData}
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {projects.length === 0 ? (
              <div className="guidance-message-state">
                <p>
                  You need to create a project before requesting
                  faculty guidance.
                </p>

                <Link
                  to="/student/project/create"
                  className="request-guidance-button guidance-create-link"
                >
                  Create Project
                  <ArrowRight size={17} />
                </Link>
              </div>
            ) : (
              <>
                {/* Project selector */}
                <div className="guidance-form-field">
                  <label htmlFor="guidance-project">
                    Select your project
                  </label>

                  <select
                    id="guidance-project"
                    value={selectedProjectId}
                    disabled={Boolean(submittingFacultyId)}
                    onChange={(event) => {
                      setSelectedProjectId(event.target.value)
                      setNotice({ type: '', text: '' })
                    }}
                  >
                    {projects.map((project) => (
                      <option
                        key={project.project_id}
                        value={String(project.project_id)}
                      >
                        #{project.project_id} — {project.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Request message */}
                <div className="guidance-form-field">
                  <label htmlFor="guidance-message">
                    Message to faculty
                  </label>

                  <textarea
                    id="guidance-message"
                    value={requestMessage}
                    onChange={(event) =>
                      setRequestMessage(event.target.value)
                    }
                    maxLength={2000}
                    rows={3}
                    placeholder="Explain what guidance you need..."
                    disabled={Boolean(submittingFacultyId)}
                  />

                  <small>
                    {requestMessage.length}/2000 characters
                  </small>
                </div>

                {/* Success or error notice */}
                {notice.text && (
                  <div
                    className={`guidance-notice ${notice.type}`}
                    role={notice.type === 'error' ? 'alert' : 'status'}
                  >
                    {notice.text}
                  </div>
                )}

                {/* Faculty cards */}
                <div className="guidance-faculty-list">
                  {facultyMembers.length === 0 ? (
                    <div className="guidance-message-state">
                      <p>
                        No active faculty members are currently accepting
                        guidance requests.
                      </p>
                    </div>
                  ) : (
                    facultyMembers.map((faculty) => {
                      const specializations = String(
                        faculty.specialization || ''
                      )
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)

                      const isAvailable =
                        Number(faculty.accepting_requests) === 1 ||
                        faculty.accepting_requests === true

                      return (
                        <article
                          className="faculty-card"
                          key={faculty.faculty_id}
                        >
                          <div className="faculty-profile">
                            <div className="faculty-avatar">
                              <UserRound size={23} />
                            </div>

                            <div className="faculty-info">
                              <div className="faculty-name-row">
                                <h3>{faculty.name}</h3>

                                <span
                                  className={
                                    isAvailable
                                      ? 'faculty-available'
                                      : 'faculty-unavailable'
                                  }
                                >
                                  <span></span>
                                  {isAvailable
                                    ? 'Accepting Requests'
                                    : 'Unavailable'}
                                </span>
                              </div>

                              <p>
                                {faculty.designation ||
                                  'Faculty Member'}
                                {faculty.department
                                  ? ` · ${faculty.department}`
                                  : ''}
                              </p>

                              <div className="faculty-detail-block">
                                <span className="faculty-detail-label">
                                  SPECIALIZATION
                                </span>

                                {specializations.length > 0 ? (
                                  <div className="faculty-specialization-list">
                                    {specializations.map((item) => (
                                      <span
                                        className="faculty-specialization-chip"
                                        key={item}
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="faculty-detail-muted">
                                    Not provided
                                  </span>
                                )}
                              </div>

                              <div className="faculty-detail-block">
                                <span className="faculty-detail-label">
                                  RESEARCH INTERESTS
                                </span>

                                <p className="faculty-research-text">
                                  {faculty.research_interests ||
                                    'Research interests not provided.'}
                                </p>
                              </div>

                              <div className="faculty-email-text">
                                {faculty.email}
                              </div>
                            </div>
                          </div>

                          <div className="faculty-action">
                            <button
                              className="request-guidance-button"
                              type="button"
                              onClick={() =>
                                handleRequest(faculty.faculty_id)
                              }
                              disabled={
                                !isAvailable ||
                                Boolean(submittingFacultyId) ||
                                hasActiveRequest
                              }
                            >
                              {submittingFacultyId ===
                              String(faculty.faculty_id)
                                ? 'Submitting...'
                                : requestStatus === 'pending'
                                  ? 'Request Pending'
                                  : requestStatus === 'accepted'
                                    ? 'Faculty Assigned'
                                    : 'Request Guidance'}

                              {!submittingFacultyId && (
                                <ArrowRight size={17} />
                              )}
                            </button>
                          </div>
                        </article>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* Request status */}
      <section className="guidance-status-section">

        <div className="guidance-section-heading">
          <div>
            <span className="section-label">
              REQUEST STATUS
            </span>

            <h2>Your guidance journey</h2>

            <p>
              {selectedProject
                ? `Current project: ${selectedProject.title}`
                : 'Select or create a project to begin.'}
            </p>
          </div>

          <span className={`current-status ${requestStatus}`}>
            {formatStatus(requestStatus)}
          </span>
        </div>

        <div className="guidance-timeline">

          <div
            className={`guidance-step ${
              selectedProject ? 'completed' : ''
            }`}
          >
            <div className="guidance-step-icon">
              <CheckCircle2 size={17} />
            </div>

            <div>
              <strong>Project Created</strong>

              <span>
                {selectedProject
                  ? 'Your project is ready for guidance.'
                  : 'Create a project to start your journey.'}
              </span>
            </div>
          </div>

          <div className="guidance-connector"></div>

          <div
            className={`guidance-step ${
              requestStatus === 'not-requested' && selectedProject
                ? 'current'
                : requestStatus !== 'not-requested'
                  ? 'completed'
                  : ''
            }`}
          >
            <div className="guidance-step-icon">
              <GraduationCap size={17} />
            </div>

            <div>
              <strong>Request Guidance</strong>

              <span>
                {!selectedProject
                  ? 'Create a project first.'
                  : requestStatus === 'not-requested'
                    ? 'Choose a faculty member and send your request.'
                    : `Request sent to ${
                        selectedProjectRequest?.faculty_name ||
                        'faculty'
                      }.`}
              </span>
            </div>
          </div>

          <div className="guidance-connector"></div>

          <div
            className={`guidance-step ${
              requestStatus === 'pending'
                ? 'current'
                : ['accepted', 'rejected'].includes(requestStatus)
                  ? 'completed'
                  : ''
            }`}
          >
            <div className="guidance-step-icon">
              {requestStatus === 'accepted' ? (
                <CheckCircle2 size={17} />
              ) : (
                <Clock3 size={17} />
              )}
            </div>

            <div>
              <strong>Faculty Response</strong>

              <span>
                {requestStatus === 'pending'
                  ? 'Waiting for faculty response.'
                  : requestStatus === 'accepted'
                    ? 'Your guidance request has been accepted.'
                    : requestStatus === 'rejected'
                      ? selectedProjectRequest?.response_message ||
                        'The faculty member rejected the request.'
                      : 'The faculty response will appear here after you send a request.'}
              </span>
            </div>
          </div>
        </div>

        {selectedProjectRequest?.response_message && (
          <div className="guidance-response-message">
            <strong>Faculty response</strong>
            <p>{selectedProjectRequest.response_message}</p>
          </div>
        )}
      </section>

      {/* Request history */}
      {requests.length > 0 && (
        <section className="guidance-history-section">
          <div className="guidance-section-heading">
            <div>
              <span className="section-label">
                REQUEST HISTORY
              </span>

              <h2>Your submitted requests</h2>

              <p>
                Track the status of your guidance requests.
              </p>
            </div>
          </div>

          <div className="guidance-history-list">
            {requests.map((request) => (
              <article
                className="guidance-history-card"
                key={request.request_id}
              >
                <div className="guidance-history-main">
                  <span className="guidance-history-id">
                    REQUEST #{request.request_id}
                  </span>

                  <h3>{request.project_title}</h3>

                  <p>
                    Faculty: {request.faculty_name || 'Faculty member'}
                    {request.faculty_department
                      ? ` · ${request.faculty_department}`
                      : ''}
                  </p>

                  <p className="guidance-history-message">
                    {request.message}
                  </p>

                  {request.response_message && (
                    <div className="guidance-history-response">
                      <strong>Faculty response</strong>
                      <p>{request.response_message}</p>
                    </div>
                  )}

                  <span className="guidance-history-date">
                    Requested {formatDate(request.requested_at)}
                  </span>
                </div>

                <span
                  className={`current-status ${
                    normalizeStatus(request.status)
                  }`}
                >
                  {formatStatus(request.status)}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default StudentGuidance