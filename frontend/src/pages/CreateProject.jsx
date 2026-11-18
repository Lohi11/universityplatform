import { useState } from 'react'
import API_BASE_URL from '../api'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Lightbulb,
  Layers3,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import './CreateProject.css'

function CreateProject() {
  const [project, setProject] = useState({
    title: '',
    problemStatement: '',
    objectives: '',
    description: '',
    technologies: '',
  })

  const [focusedField, setFocusedField] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [formMessageType, setFormMessageType] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setProject((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormMessage('')
    setFormMessageType('')

    const cleanedProject = {
      title: project.title.trim(),
      problem_statement: project.problemStatement.trim(),
      objectives: project.objectives.trim(),
      description: project.description.trim(),
      technologies: project.technologies.trim(),
    }

    if (
      cleanedProject.title.length < 3 ||
      cleanedProject.title.length > 200 ||
      cleanedProject.problem_statement.length < 10 ||
      cleanedProject.objectives.length < 10 ||
      cleanedProject.description.length < 10 ||
      !cleanedProject.technologies ||
      cleanedProject.technologies.length > 500
    ) {
      setFormMessage(
        'Enter a project title with at least 3 characters, at least 10 characters in the problem statement, objectives, and description, and technologies within 500 characters.'
      )
      setFormMessageType('error')
      return
    }

    const savedSession =
      localStorage.getItem('university_project_auth') ||
      sessionStorage.getItem('university_project_auth')

    if (!savedSession) {
      setFormMessage('Your session is missing. Please log in again.')
      setFormMessageType('error')
      return
    }

    let authData

    try {
      authData = JSON.parse(savedSession)
    } catch {
      setFormMessage('Your login session is invalid. Please log in again.')
      setFormMessageType('error')
      return
    }

    if (!authData?.access_token) {
      setFormMessage('Authentication token not found. Please log in again.')
      setFormMessageType('error')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.access_token}`,
        },
        body: JSON.stringify(cleanedProject),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detail = result.detail

        const errorMessage = Array.isArray(detail)
          ? detail.map((item) => item.msg || 'Invalid input').join(' ')
          : typeof detail === 'string'
            ? detail
            : 'Unable to save your project. Please try again.'

        setFormMessage(errorMessage)
        setFormMessageType('error')
        return
      }

      const projectId = result?.project?.project_id

      setFormMessage(
        projectId
          ? `Project saved successfully! Project ID: ${projectId}`
          : 'Project saved successfully.'
      )
      setFormMessageType('success')
    } catch (error) {
      console.error('Create project request failed:', error)

      setFormMessage(
        'Could not connect to the backend. Check that FastAPI is running.'
      )
      setFormMessageType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const technologyList = project.technologies
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    <div className="create-project-page">
      {/* Header */}
      <header className="create-project-header">
        <div className="create-project-title-area">
          <Link to="/student/project" className="back-link">
            <ArrowLeft size={16} />
            Back to My Project
          </Link>

          <div className="create-project-heading">
            <div className="create-project-heading-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <span className="create-project-eyebrow">
                PROJECT SETUP
              </span>

              <h1>Create your project</h1>

              <p>
                Build the foundation of your university project workspace.
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="setup-progress">
          <div className="setup-progress-label">
            <span>Project setup</span>
            <strong>Step 1 of 1</strong>
          </div>

          <div className="setup-progress-track">
            <div className="setup-progress-fill"></div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="create-project-layout">
        {/* Form */}
        <main className="create-project-main">
          <form
            className="project-creation-form"
            onSubmit={handleSubmit}
          >
            {formMessage && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  marginBottom: '20px',
                  padding: '12px 15px',
                  borderRadius: '10px',
                  border:
                    formMessageType === 'success'
                      ? '1px solid #a7f3d0'
                      : '1px solid #fecaca',
                  background:
                    formMessageType === 'success'
                      ? '#ecfdf5'
                      : '#fef2f2',
                  color:
                    formMessageType === 'success'
                      ? '#047857'
                      : '#b91c1c',
                  fontSize: '13px',
                  lineHeight: 1.5,
                }}
              >
                {formMessage}
              </div>
            )}

            {/* Project Identity */}
            <section className="creation-section">
              <div className="creation-section-header">
                <div className="section-number">01</div>

                <div>
                  <span>PROJECT IDENTITY</span>
                  <h2>Tell us about your project</h2>

                  <p>
                    Start with the core information that defines your project.
                  </p>
                </div>
              </div>

              {/* Title */}
              <div
                className={`premium-field ${
                  focusedField === 'title' ? 'focused' : ''
                }`}
              >
                <div className="field-label-row">
                  <label htmlFor="title">Project title</label>
                  <span>{project.title.length}/120</span>
                </div>

                <input
                  id="title"
                  name="title"
                  type="text"
                  maxLength="120"
                  value={project.title}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Give your project a clear, meaningful title"
                  required
                />

                <small>
                  Keep it specific and easy to understand.
                </small>
              </div>

              {/* Problem Statement */}
              <div
                className={`premium-field ${
                  focusedField === 'problemStatement' ? 'focused' : ''
                }`}
              >
                <div className="field-label-row">
                  <label htmlFor="problemStatement">
                    Problem statement
                  </label>

                  <span>
                    {project.problemStatement.length}/1000
                  </span>
                </div>

                <textarea
                  id="problemStatement"
                  name="problemStatement"
                  maxLength="1000"
                  value={project.problemStatement}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('problemStatement')}
                  onBlur={() => setFocusedField('')}
                  placeholder="What problem does your project aim to solve?"
                  rows="6"
                  required
                />

                <small>
                  Explain the problem, current limitation, or need your
                  project addresses.
                </small>
              </div>
            </section>

            {/* Objectives */}
            <section className="creation-section">
              <div className="creation-section-header">
                <div className="section-number">02</div>

                <div>
                  <span>OBJECTIVES</span>
                  <h2>What will your project achieve?</h2>

                  <p>
                    Describe the main outcomes you want to accomplish.
                  </p>
                </div>
              </div>

              <div
                className={`premium-field ${
                  focusedField === 'objectives' ? 'focused' : ''
                }`}
              >
                <div className="field-label-row">
                  <label htmlFor="objectives">
                    Project objectives
                  </label>

                  <span>{project.objectives.length}/1200</span>
                </div>

                <textarea
                  id="objectives"
                  name="objectives"
                  maxLength="1200"
                  value={project.objectives}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('objectives')}
                  onBlur={() => setFocusedField('')}
                  placeholder="List the main objectives and expected outcomes..."
                  rows="7"
                  required
                />

                <small>
                  You can separate multiple objectives using new lines.
                </small>
              </div>
            </section>

            {/* Description */}
            <section className="creation-section">
              <div className="creation-section-header">
                <div className="section-number">03</div>

                <div>
                  <span>PROJECT OVERVIEW</span>
                  <h2>Describe your solution</h2>

                  <p>
                    Give your faculty a clear overview of your proposed
                    solution.
                  </p>
                </div>
              </div>

              <div
                className={`premium-field ${
                  focusedField === 'description' ? 'focused' : ''
                }`}
              >
                <div className="field-label-row">
                  <label htmlFor="description">
                    Project description
                  </label>

                  <span>{project.description.length}/1500</span>
                </div>

                <textarea
                  id="description"
                  name="description"
                  maxLength="1500"
                  value={project.description}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Briefly explain how your project will address the problem..."
                  rows="7"
                  required
                />
              </div>
            </section>

            {/* Technologies */}
            <section className="creation-section">
              <div className="creation-section-header">
                <div className="section-number">04</div>

                <div>
                  <span>TECHNOLOGY STACK</span>
                  <h2>What will you build with?</h2>

                  <p>
                    Add the technologies you plan to use in your project.
                  </p>
                </div>
              </div>

              <div
                className={`premium-field ${
                  focusedField === 'technologies' ? 'focused' : ''
                }`}
              >
                <div className="field-label-row">
                  <label htmlFor="technologies">Technologies</label>
                </div>

                <div className="technology-input-wrapper">
                  <Layers3 size={18} />

                  <input
                    id="technologies"
                    name="technologies"
                    type="text"
                    maxLength="500"
                    value={project.technologies}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('technologies')}
                    onBlur={() => setFocusedField('')}
                    placeholder="React, FastAPI, MySQL"
                    required
                  />
                </div>

                <small>
                  Separate technologies using commas.
                </small>

                {technologyList.length > 0 && (
                  <div className="technology-preview">
                    {technologyList.map((technology, index) => (
                      <span
                        className="technology-chip"
                        key={`${technology}-${index}`}
                      >
                        <Check size={13} />
                        {technology}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Actions */}
            <div className="creation-actions">
              <Link
                to="/student/project"
                className="creation-cancel"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="creation-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving Project...' : 'Save Project'}
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        </main>

        {/* Preview Panel */}
        <aside className="project-preview">
          <div className="preview-sticky">
            <div className="preview-header">
              <div className="preview-icon">
                <FileText size={19} />
              </div>

              <div>
                <span>LIVE PREVIEW</span>
                <h3>Project overview</h3>
              </div>
            </div>

            <div className="preview-body">
              <div className="preview-project-title">
                {project.title || 'Your project title will appear here'}
              </div>

              <div className="preview-divider"></div>

              <div className="preview-item">
                <span>STATUS</span>
                <strong>Draft</strong>
              </div>

              <div className="preview-item">
                <span>TECHNOLOGIES</span>

                {technologyList.length > 0 ? (
                  <div className="preview-technologies">
                    {technologyList.slice(0, 4).map(
                      (technology, index) => (
                        <span key={`${technology}-${index}`}>
                          {technology}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <strong className="preview-muted">
                    Not added yet
                  </strong>
                )}
              </div>

              <div className="preview-item">
                <span>OBJECTIVES</span>

                <strong>
                  {project.objectives ? 'Added' : 'Not added yet'}
                </strong>
              </div>
            </div>

            <div className="preview-tip">
              <div className="tip-icon">
                <Lightbulb size={17} />
              </div>

              <div>
                <strong>Keep it clear</strong>

                <p>
                  A clear project description makes faculty guidance easier.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CreateProject