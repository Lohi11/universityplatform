import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  Download,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  FolderOpen,
  X,
} from 'lucide-react'

import API_BASE_URL from '../api'
import './StudentDocuments.css'

const MAX_FILE_SIZE = 15 * 1024 * 1024

const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'txt',
  'csv',
  'png',
  'jpg',
  'jpeg',
]

function getStudentSession() {
  const savedSession =
    localStorage.getItem('university_project_auth') ||
    sessionStorage.getItem('university_project_auth')

  if (!savedSession) {
    throw new Error('Please log in to manage your documents.')
  }

  let session

  try {
    session = JSON.parse(savedSession)
  } catch {
    throw new Error('Your login session is invalid. Please log in again.')
  }

  if (!session?.access_token) {
    throw new Error('Your student access token is missing.')
  }

  return session
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please log in again.')
    }

    throw new Error(
      data.detail || 'The request could not be completed.'
    )
  }

  return data
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0)

  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`

  return `${(size / (1024 * 1024)).toFixed(2)} MB`
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

function StudentDocuments() {
  const [projects, setProjects] = useState([])
  const [documents, setDocuments] = useState([])

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
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
      const session = getStudentSession()

      const headers = {
        Authorization: `Bearer ${session.access_token}`,
        Accept: 'application/json',
      }

      const [projectResponse, documentResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/projects/`, { headers }),
        fetch(`${API_BASE_URL}/documents/student`, { headers }),
      ])

      const [projectData, documentData] = await Promise.all([
        readResponse(projectResponse),
        readResponse(documentResponse),
      ])

      const projectList = Array.isArray(projectData.projects)
        ? projectData.projects
        : []

      const documentList = Array.isArray(documentData.documents)
        ? documentData.documents
        : []

      setProjects(projectList)
      setDocuments(documentList)

      setSelectedProjectId((current) => {
        const projectStillExists = projectList.some(
          (project) => String(project.project_id) === current
        )

        if (projectStillExists) return current

        return projectList.length
          ? String(projectList[0].project_id)
          : ''
      })

      setErrorMessage('')
    } catch (error) {
      console.error('Loading student documents failed:', error)

      setErrorMessage(
        error.message || 'Unable to load your documents.'
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const filteredDocuments = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    if (!query) return documents

    return documents.filter((document) =>
      [
        document.file_name,
        document.project_title,
        document.file_type,
        document.version_number,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [documents, searchText])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    setNotice({ type: '', text: '' })
    setErrorMessage('')

    if (!file) {
      setSelectedFile(null)
      return
    }

    const extension = file.name.split('.').pop().toLowerCase()

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null)
      event.target.value = ''

      setNotice({
        type: 'error',
        text: 'Unsupported file format. Please select an allowed document or image file.',
      })

      return
    }

    if (file.size === 0) {
      setSelectedFile(null)
      event.target.value = ''

      setNotice({
        type: 'error',
        text: 'The selected file is empty.',
      })

      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null)
      event.target.value = ''

      setNotice({
        type: 'error',
        text: 'The maximum file size is 15 MB.',
      })

      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async (event) => {
    event.preventDefault()

    setNotice({ type: '', text: '' })

    if (!selectedProjectId) {
      setNotice({
        type: 'error',
        text: 'Please select one of your projects.',
      })
      return
    }

    if (!selectedFile) {
      setNotice({
        type: 'error',
        text: 'Please select a file to upload.',
      })
      return
    }

    setIsUploading(true)

    try {
      const session = getStudentSession()
      const formData = new FormData()

      formData.append('file', selectedFile)

      const response = await fetch(
        `${API_BASE_URL}/documents/${selectedProjectId}/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      )

      const result = await readResponse(response)

      setNotice({
        type: 'success',
        text: result.message ||
          'Document uploaded successfully.',
      })

      setSelectedFile(null)

      const input = document.getElementById('student-document-file')

      if (input) input.value = ''

      await loadDocuments()
    } catch (error) {
      console.error('Uploading student document failed:', error)

      setNotice({
        type: 'error',
        text: error.message || 'Unable to upload the document.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (documentItem) => {
    if (downloadingId !== null) return

    setDownloadingId(documentItem.document_id)

    setNotice({ type: '', text: '' })

    try {
      const session = getStudentSession()

      const response = await fetch(
        `${API_BASE_URL}/documents/student/${documentItem.document_id}/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))

        throw new Error(
          data.detail || 'Unable to download this document.'
        )
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = url
      anchor.download = documentItem.file_name
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Downloading student document failed:', error)

      setNotice({
        type: 'error',
        text: error.message || 'Unable to download this document.',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <main className="student-documents-page">
        <div className="student-documents-loading">
          <RefreshCw size={25} className="student-document-spin" />
          <h2>Loading your documents</h2>
          <p>Retrieving project files and submission history...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="student-documents-page">

      {/* Page heading */}
      <header className="student-documents-header">
        <div>
          <span className="student-documents-eyebrow">
            PROJECT WORKSPACE
          </span>

          <h1>Documents</h1>

          <p>
            Upload project files, keep track of versions, and
            download documents submitted for your projects.
          </p>
        </div>

        <button
          type="button"
          className="student-documents-refresh"
          onClick={() => loadDocuments(true)}
          disabled={isRefreshing || isUploading}
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? 'student-document-spin' : ''}
          />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {/* General notice */}
      {errorMessage && (
        <div className="student-document-notice error" role="alert">
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
          className={`student-document-notice ${notice.type}`}
          role={notice.type === 'error' ? 'alert' : 'status'}
        >
          {notice.type === 'success'
            ? <CheckCircle2 size={18} />
            : <AlertCircle size={18} />}

          <p>{notice.text}</p>

          <button
            type="button"
            className="student-document-notice-close"
            aria-label="Dismiss message"
            onClick={() => setNotice({ type: '', text: '' })}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {!errorMessage && (
        <>
          {/* Summary cards */}
          <section className="student-document-stats">
            <article>
              <div className="student-document-stat-icon blue">
                <FolderOpen size={21} />
              </div>
              <span>Your projects</span>
              <strong>{projects.length}</strong>
            </article>

            <article>
              <div className="student-document-stat-icon purple">
                <FileText size={21} />
              </div>
              <span>Uploaded documents</span>
              <strong>{documents.length}</strong>
            </article>

            <article>
              <div className="student-document-stat-icon green">
                <CheckCircle2 size={21} />
              </div>
              <span>Latest version</span>
              <strong>
                {documents.length
                  ? Math.max(
                      ...documents.map(
                        (item) => Number(item.version_number || 1)
                      )
                    )
                  : 0}
              </strong>
            </article>
          </section>

          {/* Upload form */}
          <section className="student-document-upload-card">
            <div className="student-document-section-heading">
              <div className="student-document-upload-icon">
                <Upload size={23} />
              </div>

              <div>
                <span className="student-documents-eyebrow">
                  FILE SUBMISSION
                </span>

                <h2>Upload a project document</h2>

                <p>
                  Select a project, choose your file, and submit it securely.
                </p>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="student-document-empty-projects">
                <FolderOpen size={24} />

                <h3>No project available</h3>

                <p>
                  Create a project before uploading its documents.
                </p>

                <Link to="/student/project/create">
                  Create a project
                </Link>
              </div>
            ) : (
              <form
                className="student-document-upload-form"
                onSubmit={handleUpload}
              >
                <div className="student-document-field">
                  <label htmlFor="student-document-project">
                    Project
                  </label>

                  <select
                    id="student-document-project"
                    value={selectedProjectId}
                    onChange={(event) =>
                      setSelectedProjectId(event.target.value)
                    }
                    disabled={isUploading}
                    required
                  >
                    <option value="">Select your project</option>

                    {projects.map((project) => (
                      <option
                        key={project.project_id}
                        value={project.project_id}
                      >
                        #{project.project_id} — {project.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="student-document-field">
                  <label htmlFor="student-document-file">
                    Choose file
                  </label>

                  <div className="student-document-file-picker">
                    <input
                      id="student-document-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />

                    <span className="student-document-file-help">
                      PDF, Office files, TXT, CSV, PNG or JPG · Maximum 15 MB
                    </span>
                  </div>
                </div>

                {selectedFile && (
                  <div className="student-document-selected-file">
                    {(() => {
                      const Icon = getFileIcon(selectedFile.name)

                      return <Icon size={20} />
                    })()}

                    <div>
                      <strong>{selectedFile.name}</strong>
                      <span>{formatFileSize(selectedFile.size)}</span>
                    </div>

                    <button
                      type="button"
                      aria-label="Remove selected file"
                      onClick={() => {
                        setSelectedFile(null)

                        const input = document.getElementById(
                          'student-document-file'
                        )

                        if (input) input.value = ''
                      }}
                      disabled={isUploading}
                    >
                      <X size={17} />
                    </button>
                  </div>
                )}

                <div className="student-document-upload-actions">
                  <button
                    type="submit"
                    className="student-document-upload-button"
                    disabled={isUploading || !selectedFile}
                  >
                    {isUploading ? (
                      <RefreshCw size={17} className="student-document-spin" />
                    ) : (
                      <Upload size={17} />
                    )}

                    {isUploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Document history */}
          <section className="student-document-history">
            <div className="student-document-history-heading">
              <div>
                <span className="student-documents-eyebrow">
                  SUBMISSION HISTORY
                </span>

                <h2>Your uploaded documents</h2>

                <p>
                  All documents stored against your own projects.
                </p>
              </div>

              <span className="student-document-count">
                {documents.length} files
              </span>
            </div>

            <div className="student-document-search">
              <Search size={17} />

              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by filename or project..."
                aria-label="Search documents"
              />
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="student-document-empty">
                <div className="student-document-empty-icon">
                  <FileText size={28} />
                </div>

                <h3>
                  {documents.length === 0
                    ? 'No documents uploaded yet'
                    : 'No matching documents'}
                </h3>

                <p>
                  {documents.length === 0
                    ? 'Your submitted files will appear here after you upload them.'
                    : 'Try another search term.'}
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
              <div className="student-document-list">
                {filteredDocuments.map((item) => {
                  const Icon = getFileIcon(item.file_name)

                  return (
                    <article
                      className="student-document-item"
                      key={item.document_id}
                    >
                      <div className="student-document-item-icon">
                        <Icon size={22} />
                      </div>

                      <div className="student-document-item-main">
                        <h3>{item.file_name}</h3>

                        <p>
                          {item.project_title || `Project #${item.project_id}`}
                        </p>

                        <div className="student-document-item-meta">
                          <span>
                            Version {item.version_number || 1}
                          </span>

                          <span>{formatFileSize(item.file_size)}</span>

                          <span>
                            <CalendarDays size={13} />
                            {formatDate(item.uploaded_at)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="student-document-download"
                        onClick={() => handleDownload(item)}
                        disabled={downloadingId !== null}
                      >
                        {downloadingId === item.document_id ? (
                          <RefreshCw
                            size={16}
                            className="student-document-spin"
                          />
                        ) : (
                          <Download size={16} />
                        )}

                        <span>
                          {downloadingId === item.document_id
                            ? 'Downloading'
                            : 'Download'}
                        </span>
                      </button>
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

export default StudentDocuments