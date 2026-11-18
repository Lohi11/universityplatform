import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MessageSquare,
  Clock3,
  CheckCircle2,
  RefreshCw,
  CalendarDays,
  Send,
  GraduationCap,
  AlertCircle,
  Search,
  FileText,
} from 'lucide-react'

import API_BASE_URL from '../api'
import './StudentFeedback.css'


function getStudentSession() {
  const savedSession =
    localStorage.getItem('university_project_auth') ||
    sessionStorage.getItem('university_project_auth')

  if (!savedSession) {
    throw new Error('Your session is missing. Please log in again.')
  }

  let session

  try {
    session = JSON.parse(savedSession)
  } catch {
    throw new Error('Your login session is invalid.')
  }

  if (!session?.access_token) {
    throw new Error('Student authentication token is missing.')
  }

  return session
}


async function readResponse(response) {
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please log in again.')
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


function StudentFeedback() {
  const [feedbackItems, setFeedbackItems] = useState([])
  const [responseInputs, setResponseInputs] = useState({})

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [processingId, setProcessingId] = useState(null)

  const [errorMessage, setErrorMessage] = useState('')

  const [notice, setNotice] = useState({
    type: '',
    text: '',
  })

  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')


  // Load feedback belonging to the logged-in student.
  const loadFeedback = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setIsRefreshing(true)
      setErrorMessage('')
    }

    try {
      const session = getStudentSession()

      const response = await fetch(
        `${API_BASE_URL}/feedback/student`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            Accept: 'application/json',
          },
        }
      )

      const result = await readResponse(response)

      const items = Array.isArray(result.feedback)
        ? result.feedback
        : []

      setFeedbackItems(items)
      setErrorMessage('')

    } catch (error) {
      console.error('Student feedback loading failed:', error)

      setErrorMessage(
        error.message || 'Unable to load faculty feedback.'
      )

    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])


  useEffect(() => {
    loadFeedback()
  }, [loadFeedback])


  // Feedback statistics.
  const stats = useMemo(() => ({
    total: feedbackItems.length,

    open: feedbackItems.filter(
      (item) => item.status === 'open'
    ).length,

    resolved: feedbackItems.filter(
      (item) => item.status === 'resolved'
    ).length,

  }), [feedbackItems])


  // Search and filter.
  const filteredFeedback = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    return feedbackItems.filter((item) => {

      const matchesFilter =
        activeFilter === 'all' ||
        item.status === activeFilter

      const searchableText = [
        item.project_title,
        item.comment,
        item.faculty_name,
        item.student_response,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query || searchableText.includes(query)

      return matchesFilter && matchesSearch
    })

  }, [feedbackItems, activeFilter, searchText])


  const handleResponseChange = (feedbackId, value) => {
    setResponseInputs((previous) => ({
      ...previous,
      [feedbackId]: value,
    }))
  }


  // Student submits a response to faculty feedback.
  const handleSubmitResponse = async (feedback) => {

    const responseText = (
      responseInputs[feedback.feedback_id] || ''
    ).trim()

    if (responseText.length < 1) {
      setNotice({
        type: 'error',
        text: 'Please enter your response before submitting.',
      })
      return
    }

    if (feedback.status === 'resolved') {
      setNotice({
        type: 'error',
        text: 'This feedback has already been resolved.',
      })
      return
    }

    setProcessingId(feedback.feedback_id)

    setNotice({
      type: '',
      text: '',
    })

    try {
      const session = getStudentSession()

      const response = await fetch(
        `${API_BASE_URL}/feedback/${feedback.feedback_id}/response`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            student_response: responseText,
          }),
        }
      )

      const result = await readResponse(response)

      setFeedbackItems((previous) =>
        previous.map((item) =>
          item.feedback_id === feedback.feedback_id
            ? {
                ...item,
                student_response: result.student_response,
              }
            : item
        )
      )

      setResponseInputs((previous) => ({
        ...previous,
        [feedback.feedback_id]: '',
      }))

      setNotice({
        type: 'success',
        text: result.message || 'Your response was submitted successfully.',
      })

    } catch (error) {
      console.error('Student feedback response failed:', error)

      setNotice({
        type: 'error',
        text: error.message || 'Unable to submit your response.',
      })

    } finally {
      setProcessingId(null)
    }
  }


  if (isLoading) {
    return (
      <main className="student-feedback-page">

        <div className="student-feedback-loading">
          <RefreshCw size={25} className="student-feedback-spin" />

          <h2>Loading your feedback</h2>

          <p>Retrieving faculty comments and review updates...</p>
        </div>

      </main>
    )
  }


  return (
    <main className="student-feedback-page">

      {/* PAGE HEADER */}
      <header className="student-feedback-header">

        <div>
          <span className="student-feedback-eyebrow">
            FACULTY REVIEW
          </span>

          <h1>Feedback</h1>

          <p>
            View faculty comments, corrections and review updates
            for your university project.
          </p>
        </div>

        <div className="student-feedback-header-icon">
          <MessageSquare size={25} />
        </div>

      </header>


      {/* ERRORS */}
      {errorMessage && (
        <div className="student-feedback-alert error" role="alert">

          <AlertCircle size={19} />

          <div>
            <strong>Unable to load feedback</strong>

            <p>{errorMessage}</p>

            <button
              type="button"
              onClick={() => loadFeedback(true)}
            >
              Try Again
            </button>
          </div>

        </div>
      )}


      {/* ACTION NOTICE */}
      {notice.text && (
        <div
          className={`student-feedback-alert ${notice.type}`}
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

          {/* REVIEW STATUS */}
          <section className="student-feedback-overview">

            <div className="student-feedback-overview-icon">
              {stats.open > 0
                ? <Clock3 size={26} />
                : <CheckCircle2 size={26} />
              }
            </div>

            <div className="student-feedback-overview-content">

              <span>CURRENT REVIEW STATUS</span>

              <h2>
                {stats.total === 0
                  ? 'Awaiting Faculty Review'
                  : stats.open > 0
                    ? 'Feedback Requires Attention'
                    : 'All Feedback Resolved'
                }
              </h2>

              <p>
                {stats.total === 0
                  ? 'Faculty feedback will appear here once your project has been reviewed.'
                  : `${stats.open} open feedback item(s) and ${stats.resolved} resolved item(s).`
                }
              </p>

            </div>

            <span className={`student-feedback-main-status ${
              stats.open > 0 ? 'pending' : 'resolved'
            }`}>
              {stats.total === 0
                ? 'Awaiting Review'
                : stats.open > 0
                  ? 'Pending Review'
                  : 'Resolved'
              }
            </span>

          </section>


          {/* STATISTICS */}
          <section className="student-feedback-stats">

            <article>
              <div className="student-feedback-stat-icon total">
                <MessageSquare size={21} />
              </div>

              <span>Total Feedback</span>

              <strong>{stats.total}</strong>
            </article>


            <article>
              <div className="student-feedback-stat-icon pending">
                <Clock3 size={21} />
              </div>

              <span>Open Feedback</span>

              <strong>{stats.open}</strong>
            </article>


            <article>
              <div className="student-feedback-stat-icon resolved">
                <CheckCircle2 size={21} />
              </div>

              <span>Resolved Feedback</span>

              <strong>{stats.resolved}</strong>
            </article>

          </section>


          {/* FEEDBACK HISTORY */}
          <section className="student-feedback-list-section">

            <div className="student-feedback-list-heading">

              <div>
                <span className="student-feedback-eyebrow">
                  FACULTY REVIEW
                </span>

                <h2>Project feedback and corrections</h2>

                <p>
                  Read the comments provided by your assigned faculty member.
                </p>
              </div>

              <button
                type="button"
                className="student-feedback-refresh"
                onClick={() => loadFeedback(true)}
                disabled={isRefreshing || processingId !== null}
              >
                <RefreshCw
                  size={16}
                  className={
                    isRefreshing ? 'student-feedback-spin' : ''
                  }
                />

                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>

            </div>


            {/* SEARCH AND FILTER */}
            <div className="student-feedback-controls">

              <div className="student-feedback-search">

                <Search size={17} />

                <input
                  type="search"
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(event.target.value)
                  }
                  placeholder="Search project, faculty or feedback..."
                  aria-label="Search feedback"
                />

              </div>


              <div className="student-feedback-filters">

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
                        ? 'student-feedback-filter active'
                        : 'student-feedback-filter'
                    }
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    {filter.label}
                  </button>

                ))}

              </div>

            </div>


            {/* EMPTY STATE */}
            {filteredFeedback.length === 0 ? (

              <div className="student-feedback-empty">

                <div className="student-feedback-empty-icon">
                  <FileText size={28} />
                </div>

                <h3>
                  {stats.total === 0
                    ? 'No feedback received yet'
                    : 'No matching feedback'
                  }
                </h3>

                <p>
                  {stats.total === 0
                    ? 'When your faculty member reviews your project, their comments and corrections will appear here.'
                    : 'Try another search or change the feedback filter.'
                  }
                </p>

                {stats.total > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchText('')
                      setActiveFilter('all')
                    }}
                  >
                    Clear Filters
                  </button>
                )}

              </div>

            ) : (

              /* FEEDBACK CARDS */
              <div className="student-feedback-cards">

                {filteredFeedback.map((item) => {

                  const isResolved = item.status === 'resolved'

                  const isProcessing =
                    processingId === item.feedback_id

                  const responseText =
                    responseInputs[item.feedback_id] || ''

                  return (

                    <article
                      className="student-feedback-card"
                      key={item.feedback_id}
                    >

                      {/* CARD HEADER */}
                      <div className="student-feedback-card-header">

                        <div className="student-feedback-card-icon">
                          <GraduationCap size={22} />
                        </div>

                        <span className={`student-feedback-status ${
                          isResolved ? 'resolved' : 'open'
                        }`}>
                          {isResolved ? 'Resolved' : 'Open'}
                        </span>

                      </div>


                      <span className="student-feedback-project">
                        {item.project_title || `Project #${item.project_id}`}
                        {' · '}
                        Feedback #{item.feedback_id}
                      </span>


                      <h3>Faculty Comments & Corrections</h3>


                      {/* FACULTY COMMENT */}
                      <div className="student-feedback-comment">

                        <span>FEEDBACK FROM FACULTY</span>

                        <p>{item.comment}</p>

                      </div>


                      {/* FACULTY DETAILS */}
                      <div className="student-feedback-details">

                        <div>
                          <GraduationCap size={16} />

                          <span>
                            <small>Faculty Guide</small>

                            <strong>
                              {item.faculty_name || 'Faculty Member'}
                            </strong>
                          </span>
                        </div>


                        <div>
                          <CalendarDays size={16} />

                          <span>
                            <small>Feedback Date</small>

                            <strong>
                              {formatDate(item.created_at)}
                            </strong>
                          </span>
                        </div>

                      </div>


                      {/* STUDENT RESPONSE */}
                      {item.student_response && (
                        <div className="student-feedback-response">

                          <span>YOUR RESPONSE</span>

                          <p>{item.student_response}</p>

                        </div>
                      )}


                      {/* RESOLUTION DETAILS */}
                      {isResolved && (
                        <div className="student-feedback-resolution">

                          <CheckCircle2 size={16} />

                          <span>
                            Faculty marked this feedback as resolved.

                            {item.resolved_at && (
                              <strong>
                                {' '}
                                {formatDate(item.resolved_at)}
                              </strong>
                            )}
                          </span>

                        </div>
                      )}


                      {/* RESPONSE FORM */}
                      {!isResolved && (

                        <div className="student-feedback-response-form">

                          <label
                            htmlFor={`feedback-response-${item.feedback_id}`}
                          >
                            Respond to faculty
                          </label>

                          <textarea
                            id={`feedback-response-${item.feedback_id}`}
                            rows={3}
                            maxLength={10000}
                            value={responseText}
                            onChange={(event) =>
                              handleResponseChange(
                                item.feedback_id,
                                event.target.value
                              )
                            }
                            placeholder="Explain the corrections you have made or ask for clarification..."
                            disabled={isProcessing}
                          />

                          <div className="student-feedback-response-actions">

                            <span>
                              {responseText.length}/10000
                            </span>

                            <button
                              type="button"
                              onClick={() => handleSubmitResponse(item)}
                              disabled={
                                isProcessing ||
                                !responseText.trim()
                              }
                            >

                              {isProcessing
                                ? <RefreshCw size={16} className="student-feedback-spin" />
                                : <Send size={16} />
                              }

                              {isProcessing
                                ? 'Submitting...'
                                : 'Submit Response'
                              }

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

        </>
      )}

    </main>
  )
}

export default StudentFeedback