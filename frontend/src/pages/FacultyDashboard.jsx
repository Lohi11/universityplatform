import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  LogOut,
  ShieldCheck,
  ClipboardList,
  RefreshCw,
  Search,
  Clock3,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ArrowRight,
  FileText,
} from 'lucide-react'

import API_BASE_URL from '../api'
import './FacultyDashboard.css'

function normalizeStatus(status) {
  return String(status || 'pending')
    .toLowerCase()
    .replaceAll('_', '-')
}

function formatStatus(status) {
  return String(status || 'pending')
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

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getFacultySession() {
  const savedSession =
    localStorage.getItem('university_faculty_auth') ||
    sessionStorage.getItem('university_faculty_auth')

  if (!savedSession) {
    throw new Error(
      'Your faculty session is missing. Please log in again.'
    )
  }

  let authData

  try {
    authData = JSON.parse(savedSession)
  } catch {
    throw new Error(
      'Your faculty session is invalid. Please log in again.'
    )
  }

  if (!authData?.access_token || !authData?.faculty) {
    throw new Error(
      'Your faculty login information is incomplete.'
    )
  }

  return authData
}

function FacultyDashboard() {
  const navigate = useNavigate()

  const [faculty, setFaculty] = useState(null)
  const [requests, setRequests] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const [responseMessages, setResponseMessages] = useState({})
  const [processingRequestId, setProcessingRequestId] = useState(null)

  const [notice, setNotice] = useState({
    type: '',
    text: '',
  })

  // Load guidance requests for the logged-in faculty member.
  const loadDashboard = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setIsRefreshing(true)
      setLoadError('')
    }

    try {
      const authData = getFacultySession()

      const response = await fetch(
        `${API_BASE_URL}/guidance/faculty/requests`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
            Accept: 'application/json',
          },
        }
      )

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Your faculty session has expired. Please log in again.'
          )
        }

        if (response.status === 403) {
          throw new Error(
            'Your account is not authorized to view faculty requests.'
          )
        }

        throw new Error(
          result.detail || 'Unable to load guidance requests.'
        )
      }

      setFaculty(authData.faculty)

      setRequests(
        Array.isArray(result.requests)
          ? result.requests
          : []
      )

      setLoadError('')
    } catch (error) {
      console.error('Faculty dashboard error:', error)

      setLoadError(
        error.message || 'Unable to load the faculty dashboard.'
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // Calculate request statistics.
  const stats = useMemo(() => ({
    total: requests.length,

    pending: requests.filter(
      (request) =>
        normalizeStatus(request.status) === 'pending'
    ).length,

    accepted: requests.filter(
      (request) =>
        normalizeStatus(request.status) === 'accepted'
    ).length,

    rejected: requests.filter(
      (request) =>
        normalizeStatus(request.status) === 'rejected'
    ).length,
  }), [requests])

  // Apply search and status filters.
  const filteredRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    return requests.filter((request) => {
      const status = normalizeStatus(request.status)

      const matchesFilter =
        activeFilter === 'all' ||
        status === activeFilter

      const searchableText = [
        request.project_title,
        request.message,
        request.problem_statement,
        request.technologies,
        request.project_id,
        request.student_id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query || searchableText.includes(query)

      return matchesFilter && matchesSearch
    })
  }, [requests, activeFilter, searchText])

  const handleResponseMessageChange = (requestId, value) => {
    setResponseMessages((previous) => ({
      ...previous,
      [requestId]: value,
    }))
  }

  // Accept or reject a pending guidance request.
  const handleDecision = async (request, decision) => {
    if (normalizeStatus(request.status) !== 'pending') {
      setNotice({
        type: 'error',
        text:
          'This request has already been processed. Refresh the page to check the latest status.',
      })
      return
    }

    const responseMessage = (
      responseMessages[request.request_id] || ''
    ).trim()

    if (
      decision === 'rejected' &&
      responseMessage.length < 3
    ) {
      setNotice({
        type: 'error',
        text:
          'Please provide a short reason before rejecting a request.',
      })
      return
    }

    setProcessingRequestId(request.request_id)

    setNotice({
      type: '',
      text: '',
    })

    try {
      const authData = getFacultySession()

      const response = await fetch(
        `${API_BASE_URL}/guidance/requests/${request.request_id}/decision`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authData.access_token}`,
          },
          body: JSON.stringify({
            status: decision,
            response_message: responseMessage,
          }),
        }
      )

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Your faculty session has expired. Please log in again.'
          )
        }

        throw new Error(
          result.detail || 'Unable to process this request.'
        )
      }

      setRequests((previous) =>
        previous.map((item) =>
          item.request_id === request.request_id
            ? {
                ...item,
                status: result.request.status,
                response_message:
                  result.request.response_message,
                responded_at: new Date().toISOString(),
                assigned_faculty_id:
                  result.request.assigned_faculty_id,
              }
            : item
        )
      )

      setNotice({
        type: 'success',
        text:
          result.message ||
          `Request ${decision} successfully.`,
      })

      setResponseMessages((previous) => ({
        ...previous,
        [request.request_id]: '',
      }))
    } catch (error) {
      console.error('Guidance decision failed:', error)

      setNotice({
        type: 'error',
        text:
          error.message || 'Unable to process this request.',
      })
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('university_faculty_auth')
    sessionStorage.removeItem('university_faculty_auth')

    navigate('/faculty/login', {
      replace: true,
    })
  }

  if (isLoading) {
    return (
      <main className="faculty-dashboard-page">
        <div className="faculty-dashboard-loading">
          <RefreshCw size={23} />
          <h2>Loading your faculty workspace</h2>
          <p>Retrieving your guidance requests...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="faculty-dashboard-page">

      {/* Header */}
      <header className="faculty-dashboard-header">
        <div className="faculty-dashboard-header-inner">

          <div className="faculty-dashboard-brand">
            <span className="faculty-dashboard-brand-icon">
              <GraduationCap size={22} />
            </span>

            <span className="faculty-dashboard-brand-text">
              University<span>Project</span>
            </span>

            <span className="faculty-dashboard-brand-divider"></span>

            <span className="faculty-dashboard-brand-subtitle">
              Faculty Workspace
            </span>
          </div>

          <div className="faculty-dashboard-header-actions">
            <Link
  to="/faculty/documents"
  className="faculty-dashboard-refresh faculty-dashboard-documents-link"
>
  <FileText size={16} />
  Student Documents
</Link>

            <div className="faculty-dashboard-user">
              <div className="faculty-dashboard-user-icon">
                <ShieldCheck size={19} />
              </div>

              <div>
                <strong>{faculty?.name || 'Faculty'}</strong>

                <span>
                  {faculty?.department || 'Faculty Account'}
                </span>
              </div>
            </div>

            {/* New: Open Faculty Milestones Management */}
            <Link
              to="/faculty/milestones"
              className="faculty-dashboard-refresh faculty-dashboard-milestones-link"
            >
              <CalendarDays size={16} />
              Manage Milestones
            </Link>

            <button
              type="button"
              className="faculty-dashboard-logout"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </button>

          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="faculty-dashboard-content">

        <section className="faculty-dashboard-welcome">
          <div>
            <span className="faculty-dashboard-eyebrow">
              FACULTY WORKSPACE
            </span>

            <h1>
              Welcome back, {faculty?.name || 'Faculty Member'}
            </h1>

            <p>
              Review project guidance requests, inspect proposals,
              and manage your response to each student.
            </p>
          </div>

          <button
            type="button"
            className="faculty-dashboard-refresh"
            onClick={() => loadDashboard(true)}
            disabled={
              isRefreshing ||
              Boolean(processingRequestId)
            }
          >
            <RefreshCw
              size={16}
              className={
                isRefreshing ? 'refresh-spinning' : ''
              }
            />

            {isRefreshing
              ? 'Refreshing...'
              : 'Refresh Requests'}
          </button>
        </section>

        {/* Faculty profile */}
        <section className="faculty-dashboard-profile">

          <div className="faculty-dashboard-profile-icon">
            <GraduationCap size={25} />
          </div>

          <div className="faculty-dashboard-profile-info">

            <span className="faculty-dashboard-label">
              SIGNED IN AS
            </span>

            <h2>{faculty?.name}</h2>

            <p>
              {faculty?.designation || 'Faculty Member'}
              {faculty?.department
                ? ` · ${faculty.department}`
                : ''}
            </p>

            {faculty?.specialization && (
              <p>
                Specialization: {faculty.specialization}
              </p>
            )}

            {faculty?.email && (
              <p>{faculty.email}</p>
            )}

          </div>

          <ShieldCheck
            className="faculty-dashboard-verified"
            size={25}
          />

        </section>

        {/* Statistics */}
        <section className="faculty-dashboard-stats">

          <article className="faculty-stat-card">
            <div className="faculty-stat-icon stat-total-icon">
              <ClipboardList size={21} />
            </div>
            <span>Total Requests</span>
            <strong>{stats.total}</strong>
          </article>

          <article className="faculty-stat-card">
            <div className="faculty-stat-icon stat-pending-icon">
              <Clock3 size={21} />
            </div>
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </article>

          <article className="faculty-stat-card">
            <div className="faculty-stat-icon stat-accepted-icon">
              <CheckCircle2 size={21} />
            </div>
            <span>Accepted</span>
            <strong>{stats.accepted}</strong>
          </article>

          <article className="faculty-stat-card">
            <div className="faculty-stat-icon stat-rejected-icon">
              <XCircle size={21} />
            </div>
            <span>Rejected</span>
            <strong>{stats.rejected}</strong>
          </article>

        </section>

        {/* Guidance request section */}
        <section className="faculty-inbox-section">

          <div className="faculty-inbox-heading">
            <div>
              <span className="faculty-dashboard-eyebrow">
                PROJECT SUPERVISION
              </span>

              <h2>Guidance requests</h2>

              <p>
                Requests sent to your faculty account.
              </p>
            </div>

            <span className="faculty-inbox-count">
              {stats.pending} pending
            </span>
          </div>

          {/* Error message */}
          {loadError && (
            <div
              className="faculty-dashboard-notice error"
              role="alert"
            >
              <p>{loadError}</p>

              <button
                type="button"
                onClick={() => loadDashboard(true)}
              >
                Try again
              </button>
            </div>
          )}

          {/* Success or error notice */}
          {notice.text && (
            <div
              className={`faculty-dashboard-notice ${notice.type}`}
              role={notice.type === 'error' ? 'alert' : 'status'}
            >
              {notice.text}
            </div>
          )}

          {/* Search and filters */}
          <div className="faculty-inbox-controls">

            <div className="faculty-inbox-search">
              <Search size={17} />

              <input
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="Search project title, technologies or message..."
                aria-label="Search guidance requests"
              />
            </div>

            <div className="faculty-inbox-filters">
              {[
                { label: 'All', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Accepted', value: 'accepted' },
                { label: 'Rejected', value: 'rejected' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={
                    activeFilter === filter.value
                      ? 'faculty-filter-button active'
                      : 'faculty-filter-button'
                  }
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requests */}
          {!loadError && filteredRequests.length === 0 ? (
            <div className="faculty-inbox-empty">

              <div className="faculty-inbox-empty-icon">
                <ClipboardList size={27} />
              </div>

              <h3>
                {requests.length === 0
                  ? 'No guidance requests yet'
                  : 'No matching requests'}
              </h3>

              <p>
                {requests.length === 0
                  ? 'When a student selects you and submits a guidance request, it will appear here.'
                  : 'Try another search term or select a different status filter.'}
              </p>

              {requests.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText('')
                    setActiveFilter('all')
                  }}
                >
                  Clear filters
                </button>
              )}

            </div>
          ) : (
            <div className="faculty-request-list">

              {filteredRequests.map((request) => {
                const status = normalizeStatus(request.status)
                const isPending = status === 'pending'

                const isProcessing =
                  processingRequestId === request.request_id

                const technologies = String(
                  request.technologies || ''
                )
                  .split(',')
                  .map((technology) => technology.trim())
                  .filter(Boolean)

                return (
                  <article
                    className="faculty-request-card"
                    key={request.request_id}
                  >

                    {/* Request header */}
                    <div className="faculty-request-card-header">

                      <div className="faculty-request-title-group">
                        <span className="faculty-request-reference">
                          REQUEST #{request.request_id}
                        </span>

                        <h3>{request.project_title}</h3>

                        <span className="faculty-request-project-id">
                          Project #{request.project_id}
                          {' · '}
                          Student ID #{request.student_id}
                        </span>
                      </div>

                      <span
                        className={`faculty-request-status status-${status}`}
                      >
                        {formatStatus(status)}
                      </span>

                    </div>

                    {/* Student message */}
                    <div className="faculty-request-message">
                      <span className="faculty-request-field-label">
                        STUDENT MESSAGE
                      </span>

                      <p>{request.message}</p>
                    </div>

                    {/* Project overview */}
                    <div className="faculty-request-project-details">

                      <div className="faculty-request-detail">
                        <span className="faculty-request-field-label">
                          PROBLEM STATEMENT
                        </span>

                        <p>
                          {request.problem_statement ||
                            'No problem statement provided.'}
                        </p>
                      </div>

                      <div className="faculty-request-detail">
                        <span className="faculty-request-field-label">
                          OBJECTIVES
                        </span>

                        <p>
                          {request.objectives ||
                            'No objectives provided.'}
                        </p>
                      </div>

                      <div className="faculty-request-detail">
                        <span className="faculty-request-field-label">
                          PROJECT DESCRIPTION
                        </span>

                        <p>
                          {request.description ||
                            'No project description provided.'}
                        </p>
                      </div>

                      <div className="faculty-request-detail">
                        <span className="faculty-request-field-label">
                          TECHNOLOGIES
                        </span>

                        <div className="faculty-request-technologies">
                          {technologies.length > 0 ? (
                            technologies.map((technology, index) => (
                              <span
                                key={`${request.request_id}-${technology}-${index}`}
                              >
                                {technology}
                              </span>
                            ))
                          ) : (
                            <span>No technologies listed</span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Request dates */}
                    <div className="faculty-request-meta">
                      <span>
                        <CalendarDays size={14} />
                        Received {formatDate(request.requested_at)}
                      </span>

                      {request.responded_at && (
                        <span>
                          Responded {formatDate(request.responded_at)}
                        </span>
                      )}
                    </div>

                    {/* Existing response */}
                    {!isPending && request.response_message && (
                      <div className="faculty-existing-response">
                        <strong>Your recorded response</strong>
                        <p>{request.response_message}</p>
                      </div>
                    )}

                    {/* Decision actions */}
                    {isPending && (
                      <div className="faculty-request-actions">

                        <label
                          className="faculty-request-response-label"
                          htmlFor={`response-${request.request_id}`}
                        >
                          Response message
                          <span>Required when rejecting</span>
                        </label>

                        <textarea
                          id={`response-${request.request_id}`}
                          value={
                            responseMessages[request.request_id] || ''
                          }
                          onChange={(event) =>
                            handleResponseMessageChange(
                              request.request_id,
                              event.target.value
                            )
                          }
                          maxLength={2000}
                          rows={3}
                          placeholder="Explain your decision or give the student next steps..."
                          disabled={isProcessing}
                        />

                        <div className="faculty-request-response-footer">
                          <span>
                            {(responseMessages[request.request_id] || '').length}
                            /2000
                          </span>
                        </div>

                        <div className="faculty-request-action-buttons">

                          <button
                            type="button"
                            className="faculty-decision-button reject-button"
                            onClick={() =>
                              handleDecision(request, 'rejected')
                            }
                            disabled={isProcessing}
                          >
                            <XCircle size={17} />
                            {isProcessing
                              ? 'Processing...'
                              : 'Reject Request'}
                          </button>

                          <button
                            type="button"
                            className="faculty-decision-button accept-button"
                            onClick={() =>
                              handleDecision(request, 'accepted')
                            }
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <RefreshCw size={17} />
                            ) : (
                              <CheckCircle2 size={17} />
                            )}

                            {isProcessing
                              ? 'Processing...'
                              : 'Accept Request'}

                            {!isProcessing && (
                              <ArrowRight size={16} />
                            )}
                          </button>

                        </div>
                      </div>
                    )}

                  </article>
                )
              })}

            </div>
          )}

        </section>

      </div>
    </main>
  )
}

export default FacultyDashboard