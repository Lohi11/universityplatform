import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  Download,
  Search,
  RefreshCw,
  CalendarDays,
  FolderOpen,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

import API_BASE_URL from '../api'
import './FacultyDocuments.css'

function getFacultySession() {
  const savedSession =
    localStorage.getItem('university_faculty_auth') ||
    sessionStorage.getItem('university_faculty_auth')

  if (!savedSession) {
    throw new Error('Please log in to access faculty documents.')
  }

  let session

  try {
    session = JSON.parse(savedSession)
  } catch {
    throw new Error('Your faculty session is invalid. Please log in again.')
  }

  if (!session?.access_token) {
    throw new Error('Your faculty access token is missing.')
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
      result.detail || 'Unable to retrieve faculty documents.'
    )
  }

  return result
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

function formatFileSize(bytes) {
  const size = Number(bytes || 0)

  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`

  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

function getFileIcon(fileName) {
  const extension = String(fileName || '')
    .split('.')
    .pop()
    .toLowerCase()

  if (['png', 'jpg', 'jpeg'].includes(extension)) {
    return FileImage
  }

  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return FileSpreadsheet
  }

  if (['ppt', 'pptx'].includes(extension)) {
    return Presentation
  }

  return FileText
}

function FacultyDocuments() {
  const navigate = useNavigate()

  const [faculty, setFaculty] = useState(null)
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState({
    type: '',
    text: '',
  })

  const loadDocuments = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setIsRefreshing(true)
      setErrorMessage('')
    }

    try {
      const session = getFacultySession()

      const response = await fetch(
        `${API_BASE_URL}/documents/faculty`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            Accept: 'application/json',
          },
        }
      )

      if (response.status === 401) {
        localStorage.removeItem('university_faculty_auth')
        sessionStorage.removeItem('university_faculty_auth')

        navigate('/faculty/login', { replace: true })
        return
      }

      const result = await readResponse(response)

      setFaculty(session.faculty)
      setDocuments(
        Array.isArray(result.documents)
          ? result.documents
          : []
      )
      setErrorMessage('')
    } catch (error) {
      console.error('Faculty documents loading failed:', error)

      setErrorMessage(
        error.message || 'Unable to load submitted documents.'
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const filteredDocuments = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    if (!query) return documents

    return documents.filter((item) =>
      [
        item.file_name,
        item.project_title,
        item.student_name,
        item.student_id,
        item.project_id,
        item.file_type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [documents, searchText])

  const handleDownload = async (item) => {
    if (downloadingId !== null) return

    setDownloadingId(item.document_id)
    setNotice({ type: '', text: '' })

    try {
      const session = getFacultySession()

      const response = await fetch(
        `${API_BASE_URL}/documents/faculty/${item.document_id}/download`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))

        if (response.status === 401) {
          localStorage.removeItem('university_faculty_auth')
          sessionStorage.removeItem('university_faculty_auth')

          navigate('/faculty/login', { replace: true })
          return
        }

        throw new Error(
          result.detail || 'Unable to download the document.'
        )
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = objectUrl
      anchor.download = item.file_name
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      // Release the temporary URL after the download begins.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)

      setNotice({
        type: 'success',
        text: `${item.file_name} downloaded successfully.`,
      })
    } catch (error) {
      console.error('Faculty document download failed:', error)

      setNotice({
        type: 'error',
        text: error.message || 'Unable to download the document.',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <main className="faculty-documents-page">
        <div className="faculty-documents-loading">
          <RefreshCw size={25} className="faculty-documents-spin" />
          <h2>Loading submitted documents</h2>
          <p>Retrieving documents for your assigned projects...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="faculty-documents-page">

      <header className="faculty-documents-header">
        <div className="faculty-documents-brand">
          <span className="faculty-documents-brand-icon">
            <GraduationCap size={22} />
          </span>

          <span>
            University<span>Project</span>
          </span>
        </div>

        <div className="faculty-documents-header-actions">
          <span className="faculty-documents-user">
            {faculty?.name || 'Faculty'}
          </span>

          <Link
            to="/faculty/dashboard"
            className="faculty-documents-back"
          >
            Back to Faculty Dashboard
          </Link>
        </div>
      </header>

      <div className="faculty-documents-content">

        <section className="faculty-documents-heading">
          <div>
            <span className="faculty-documents-eyebrow">
              PROJECT REVIEW
            </span>

            <h1>Student Documents</h1>

            <p>
              Review and download submissions from students whose
              projects are assigned to you.
            </p>
          </div>

          <button
            type="button"
            className="faculty-documents-refresh"
            onClick={() => loadDocuments(true)}
            disabled={isRefreshing || downloadingId !== null}
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? 'faculty-documents-spin' : ''}
            />

            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </section>

        {errorMessage && (
          <div className="faculty-documents-notice error" role="alert">
            <AlertCircle size={18} />

            <div>
              <strong>Unable to load documents</strong>
              <p>{errorMessage}</p>

              <button
                type="button"
                onClick={() => loadDocuments(true)}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {notice.text && (
          <div
            className={`faculty-documents-notice ${notice.type}`}
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
            <section className="faculty-documents-stats">
              <article>
                <div className="faculty-documents-stat-icon blue">
                  <FolderOpen size={21} />
                </div>

                <span>Submitted documents</span>
                <strong>{documents.length}</strong>
              </article>

              <article>
                <div className="faculty-documents-stat-icon purple">
                  <GraduationCap size={21} />
                </div>

                <span>Student submissions</span>
                <strong>
                  {new Set(documents.map((item) => item.student_id)).size}
                </strong>
              </article>

              <article>
                <div className="faculty-documents-stat-icon green">
                  <FileText size={21} />
                </div>

                <span>Projects with submissions</span>
                <strong>
                  {new Set(documents.map((item) => item.project_id)).size}
                </strong>
              </article>
            </section>

            <section className="faculty-documents-list-section">
              <div className="faculty-documents-list-heading">
                <div>
                  <span className="faculty-documents-eyebrow">
                    SUBMISSION HISTORY
                  </span>

                  <h2>Documents submitted by students</h2>

                  <p>
                    Only documents for your assigned projects are shown.
                  </p>
                </div>

                <span className="faculty-documents-count">
                  {documents.length} files
                </span>
              </div>

              <div className="faculty-documents-search">
                <Search size={17} />

                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search filename, student or project..."
                  aria-label="Search submitted documents"
                />
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="faculty-documents-empty">
                  <div className="faculty-documents-empty-icon">
                    <FileText size={28} />
                  </div>

                  <h3>
                    {documents.length === 0
                      ? 'No documents submitted yet'
                      : 'No matching documents'}
                  </h3>

                  <p>
                    {documents.length === 0
                      ? 'When a student uploads a file to a project assigned to you, it will appear here.'
                      : 'Try a different search term.'}
                  </p>

                  {documents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSearchText('')}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="faculty-documents-list">
                  {filteredDocuments.map((item) => {
                    const Icon = getFileIcon(item.file_name)

                    return (
                      <article
                        className="faculty-document-card"
                        key={item.document_id}
                      >
                        <div className="faculty-document-icon">
                          <Icon size={22} />
                        </div>

                        <div className="faculty-document-main">
                          <h3>{item.file_name}</h3>

                          <p className="faculty-document-project">
                            {item.project_title || `Project #${item.project_id}`}
                          </p>

                          <div className="faculty-document-meta">
                            <span>
                              Student: {item.student_name || `#${item.student_id}`}
                            </span>

                            <span>
                              Project #{item.project_id}
                            </span>

                            <span>
                              Version {item.version_number || 1}
                            </span>

                            <span>
                              {formatFileSize(item.file_size)}
                            </span>

                            <span>
                              <CalendarDays size={13} />
                              {formatDate(item.uploaded_at)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="faculty-document-download"
                          onClick={() => handleDownload(item)}
                          disabled={downloadingId !== null}
                        >
                          {downloadingId === item.document_id
                            ? <RefreshCw size={16} className="faculty-documents-spin" />
                            : <Download size={16} />}

                          {downloadingId === item.document_id
                            ? 'Downloading...'
                            : 'Download'}
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

export default FacultyDocuments