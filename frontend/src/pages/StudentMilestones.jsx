import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ListTodo,
  AlertTriangle,
  GraduationCap,
  ArrowRight,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import API_BASE_URL from '../api'
import './StudentMilestones.css'


function formatStatus(status) {
  const labels = {
    pending: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
  }

  return labels[String(status || '').toLowerCase()] || status
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


function getStudentSession() {
  const savedSession =
    localStorage.getItem('university_project_auth') ||
    sessionStorage.getItem('university_project_auth')

  if (!savedSession) {
    throw new Error('Please log in to view your milestones.')
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


function StudentMilestones() {
  const [milestones, setMilestones] = useState([])
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


  // Retrieve only the milestones belonging to the logged-in student.
  const loadMilestones = useCallback(async (manualRefresh = false) => {
    // Let the initial page render its loading state before fetching.
    await Promise.resolve()

    if (manualRefresh) {
      setIsRefreshing(true)
      setErrorMessage('')
      setNotice({ type: '', text: '' })
    }

    try {
      const authData = getStudentSession()

      const response = await fetch(
        `${API_BASE_URL}/milestones/student`,
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
            'Your student session has expired. Please log in again.'
          )
        }

        throw new Error(
          result.detail || 'Unable to retrieve your milestones.'
        )
      }

      setMilestones(
        Array.isArray(result.milestones)
          ? result.milestones
          : []
      )

      setErrorMessage('')
    } catch (error) {
      console.error('Student milestones loading failed:', error)

      setErrorMessage(
        error.message || 'Unable to load milestones.'
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])


  useEffect(() => {
    loadMilestones()
  }, [loadMilestones])


  // Calculate the progress totals from the latest API response.
  const stats = useMemo(() => {
    return {
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
    }
  }, [milestones])


  const progressPercentage = stats.total === 0
    ? 0
    : Math.round((stats.completed / stats.total) * 100)


  const filteredMilestones = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    return milestones.filter((item) => {
      const matchesFilter =
        activeFilter === 'all' ||
        item.status === activeFilter

      const searchableText = [
        item.title,
        item.description,
        item.project_title,
        item.faculty_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query || searchableText.includes(query)

      return matchesFilter && matchesSearch
    })
  }, [milestones, activeFilter, searchText])


  // Update a milestone through the student-authorized backend endpoint.
  const handleStatusChange = async (milestone, newStatus) => {
    if (processingId !== null) return

    if (
      !['pending', 'in_progress', 'completed'].includes(newStatus)
    ) {
      return
    }

    setProcessingId(milestone.milestone_id)

    setNotice({
      type: '',
      text: '',
    })

    try {
      const authData = getStudentSession()

      const response = await fetch(
        `${API_BASE_URL}/milestones/${milestone.milestone_id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authData.access_token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      )

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          result.detail || 'Unable to update milestone progress.'
        )
      }

      // Update the page only after the backend confirms success.
      setMilestones((previous) =>
        previous.map((item) => {
          if (item.milestone_id !== milestone.milestone_id) {
            return item
          }

          return {
            ...item,
            status: result.status || newStatus,
            completed_at:
              newStatus === 'completed'
                ? new Date().toISOString()
                : null,
          }
        })
      )

      setNotice({
        type: 'success',
        text: `Progress updated: "${milestone.title}" is now ${formatStatus(newStatus).toLowerCase()}.`,
      })
    } catch (error) {
      console.error('Milestone status update failed:', error)

      setNotice({
        type: 'error',
        text: error.message || 'Unable to update milestone progress.',
      })
    } finally {
      setProcessingId(null)
    }
  }


  const clearFilters = () => {
    setSearchText('')
    setActiveFilter('all')
  }


  if (isLoading) {
    return (
      <main className="student-milestones-page">
        <div className="student-milestones-loading">
          <RefreshCw size={25} className="milestone-spin" />
          <h2>Loading your milestones</h2>
          <p>Retrieving project tasks and deadlines...</p>
        </div>
      </main>
    )
  }


  return (
    <main className="student-milestones-page">

      {/* Page heading */}
      <header className="student-milestones-header">

        <div className="student-milestones-heading">

          <span className="student-milestones-eyebrow">
            PROJECT PROGRESS
          </span>

          <h1>Milestones & Deadlines</h1>

          <p>
            Track your project tasks, monitor deadlines and
            keep your academic project moving forward.
          </p>

        </div>

        <button
          type="button"
          className="student-milestones-refresh"
          onClick={() => loadMilestones(true)}
          disabled={isRefreshing || processingId !== null}
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? 'milestone-spin' : ''}
          />

          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>

      </header>


      {/* Error and success messages */}
      {errorMessage && (
        <section className="student-milestones-alert error" role="alert">
          <AlertTriangle size={19} />

          <div>
            <strong>Unable to load milestones</strong>
            <p>{errorMessage}</p>

            <button
              type="button"
              onClick={() => loadMilestones(true)}
            >
              Retry
            </button>
          </div>
        </section>
      )}

      {notice.text && (
        <div
          className={`student-milestones-alert ${notice.type}`}
          role={notice.type === 'error' ? 'alert' : 'status'}
        >
          {notice.type === 'success'
            ? <CheckCircle2 size={18} />
            : <AlertTriangle size={18} />}

          <p>{notice.text}</p>
        </div>
      )}


      {!errorMessage && (
        <>

          {/* Progress overview */}
          <section className="student-milestones-overview">

            <div className="milestone-overview-top">

              <div>
                <span className="milestone-small-label">
                  OVERALL COMPLETION
                </span>

                <h2>{progressPercentage}%</h2>

                <p>
                  {stats.completed} of {stats.total} milestones completed
                </p>
              </div>

              <div className="milestone-overview-icon">
                <ListTodo size={26} />
              </div>

            </div>

            <div
              className="milestone-progress-track"
              role="progressbar"
              aria-label="Overall milestone completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercentage}
            >
              <div
                className="milestone-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="milestone-progress-caption">
              <span>Project progress</span>
              <strong>{progressPercentage}% complete</strong>
            </div>

          </section>


          {/* Statistics */}
          <section className="student-milestone-stats">

            <article className="student-milestone-stat">
              <div className="student-stat-icon total">
                <ListTodo size={20} />
              </div>

              <span>Total milestones</span>
              <strong>{stats.total}</strong>
            </article>

            <article className="student-milestone-stat">
              <div className="student-stat-icon pending">
                <Clock3 size={20} />
              </div>

              <span>Not started</span>
              <strong>{stats.pending}</strong>
            </article>

            <article className="student-milestone-stat">
              <div className="student-stat-icon progress">
                <RefreshCw size={20} />
              </div>

              <span>In progress</span>
              <strong>{stats.inProgress}</strong>
            </article>

            <article className="student-milestone-stat">
              <div className="student-stat-icon completed">
                <CheckCircle2 size={20} />
              </div>

              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </article>

          </section>


          {/* Milestone list */}
          <section className="student-milestone-list-section">

            <div className="student-milestone-list-heading">

              <div>
                <span className="student-milestones-eyebrow">
                  YOUR WORKSPACE
                </span>

                <h2>Your milestones</h2>

                <p>
                  Milestones assigned to your own projects by faculty.
                </p>
              </div>

              <span className="student-milestone-total">
                {stats.total} total
              </span>

            </div>


            {/* Search */}
            <div className="student-milestone-controls">

              <div className="student-milestone-search">
                <Search size={17} />

                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search milestones or projects..."
                  aria-label="Search milestones"
                />
              </div>

              <div className="student-milestone-filters">

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
                      activeFilter === filter.value
                        ? 'student-milestone-filter active'
                        : 'student-milestone-filter'
                    }
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}

              </div>

            </div>


            {/* Empty or filtered state */}
            {filteredMilestones.length === 0 ? (
              <div className="student-milestone-empty">

                <div className="student-milestone-empty-icon">
                  <CalendarDays size={28} />
                </div>

                <h3>
                  {stats.total === 0
                    ? 'No milestones assigned yet'
                    : 'No matching milestones'}
                </h3>

                <p>
                  {stats.total === 0
                    ? 'When your assigned faculty creates project milestones, they will appear here with their deadlines.'
                    : 'Try another search term or change your status filter.'}
                </p>

                {stats.total > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}

                {stats.total === 0 && (
                  <Link
                    to="/student/project"
                    className="student-milestone-project-link"
                  >
                    View My Project
                    <ArrowRight size={16} />
                  </Link>
                )}

              </div>
            ) : (
              <div className="student-milestone-cards">

                {filteredMilestones.map((milestone) => {
                  const isProcessing =
                    processingId === milestone.milestone_id

                  const isOverdue =
                    milestone.status === 'overdue'

                  return (
                    <article
                      className="student-milestone-card"
                      key={milestone.milestone_id}
                    >

                      <div className="student-milestone-card-header">

                        <div className="student-milestone-card-icon">
                          {milestone.status === 'completed'
                            ? <CheckCircle2 size={22} />
                            : milestone.status === 'overdue'
                              ? <AlertTriangle size={22} />
                              : <CalendarDays size={22} />}
                        </div>

                        <span
                          className={`student-milestone-status status-${milestone.status}`}
                        >
                          {formatStatus(milestone.status)}
                        </span>

                      </div>


                      <span className="student-milestone-project">
                        {milestone.project_title || 'Project'}
                        {' · '}
                        Milestone #{milestone.milestone_id}
                      </span>

                      <h3>{milestone.title}</h3>

                      <p className="student-milestone-description">
                        {milestone.description ||
                          'No additional description was provided.'}
                      </p>


                      <div className="student-milestone-details">

                        <div>
                          <CalendarDays size={16} />

                          <span>
                            <small>Deadline</small>
                            <strong>{formatDate(milestone.due_date)}</strong>
                          </span>
                        </div>

                        {milestone.faculty_name && (
                          <div>
                            <GraduationCap size={16} />

                            <span>
                              <small>Faculty guide</small>
                              <strong>{milestone.faculty_name}</strong>
                            </span>
                          </div>
                        )}

                      </div>


                      <div className="student-milestone-update">

                        <label
                          htmlFor={`milestone-status-${milestone.milestone_id}`}
                        >
                          Update progress
                        </label>

                        <select
                          id={`milestone-status-${milestone.milestone_id}`}
                          value={milestone.status}
                          disabled={isProcessing}
                          onChange={(event) =>
                            handleStatusChange(
                              milestone,
                              event.target.value
                            )
                          }
                        >
                          {isOverdue && (
                            <option value="overdue" disabled>
                              Overdue
                            </option>
                          )}

                          <option value="pending">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>

                        {isProcessing && (
                          <span className="student-milestone-saving">
                            Saving progress...
                          </span>
                        )}

                      </div>

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

export default StudentMilestones