import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'

import API_BASE_URL from '../api'
import './FacultyLogin.css'

function FacultyLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/faculty-auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      )

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setErrorMessage(
          typeof result.detail === 'string'
            ? result.detail
            : 'Login failed. Please check your credentials.'
        )
        return
      }

      if (!result.access_token || !result.faculty) {
        setErrorMessage(
          'The server response is incomplete. Please try again.'
        )
        return
      }

      const facultySession = {
        access_token: result.access_token,
        token_type: result.token_type || 'bearer',
        faculty: result.faculty,
      }

      // Keep faculty authentication separate from student authentication.
      localStorage.removeItem('university_faculty_auth')
      sessionStorage.removeItem('university_faculty_auth')

      const storage = rememberMe ? localStorage : sessionStorage

      storage.setItem(
        'university_faculty_auth',
        JSON.stringify(facultySession)
      )

      navigate('/faculty/dashboard', { replace: true })
    } catch (error) {
      console.error('Faculty login failed:', error)

      setErrorMessage(
        'Cannot connect to the backend. Check that FastAPI is running.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="faculty-login-page">

      {/* Left branding panel */}
      <section className="faculty-login-brand">

        <Link to="/" className="faculty-login-logo">
          <span className="faculty-login-logo-icon">
            <GraduationCap size={23} />
          </span>

          <span>
            University<span>Project</span>
          </span>
        </Link>

        <div className="faculty-login-brand-content">
          <span className="faculty-login-eyebrow">
            FACULTY WORKSPACE
          </span>

          <h1>
            Guide projects.
            <br />
            Shape <span>the future.</span>
          </h1>

          <p>
            Manage student guidance requests, supervise
            academic projects, track milestones and provide
            meaningful feedback from one workspace.
          </p>

          <div className="faculty-login-benefit">
            <ShieldCheck size={20} />

            <div>
              <strong>Secure faculty access</strong>
              <span>
                Sign in using your authorized faculty account.
              </span>
            </div>
          </div>
        </div>

        <div className="faculty-login-brand-footer">
          University Project Management Platform
        </div>

      </section>

      {/* Login form */}
      <section className="faculty-login-form-section">

        <div className="faculty-login-form-container">

          <Link to="/" className="faculty-login-back">
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="faculty-login-form-heading">
            <div className="faculty-login-form-icon">
              <GraduationCap size={25} />
            </div>

            <span className="faculty-login-eyebrow">
              FACULTY PORTAL
            </span>

            <h2>Welcome back</h2>

            <p>
              Sign in to manage your student projects and
              guidance requests.
            </p>
          </div>

          <form
            className="faculty-login-form"
            onSubmit={handleSubmit}
          >

            {errorMessage && (
              <div
                className="faculty-login-error"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <div className="faculty-login-field">
              <label htmlFor="faculty-email">
                Faculty email
              </label>

              <div className="faculty-login-input-wrapper">
                <Mail size={18} />

                <input
                  id="faculty-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your registered email"
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="faculty-login-field">
              <label htmlFor="faculty-password">
                Password
              </label>

              <div className="faculty-login-input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="faculty-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  className="faculty-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword
                    ? <EyeOff size={17} />
                    : <Eye size={17} />}
                </button>
              </div>
            </div>

            <label className="faculty-remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(event.target.checked)
                }
                disabled={isSubmitting}
              />

              <span>Remember me on this device</span>
            </label>

            <button
              type="submit"
              className="faculty-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}

              {!isSubmitting && <ArrowRight size={18} />}
            </button>

          </form>

          <p className="faculty-login-account-note">
            Faculty accounts are provisioned through an
            authorized setup process. Public faculty signup
            is not enabled.
          </p>

          <div className="faculty-login-student-link">
            Are you a student?{' '}

            <Link to="/login">
              Student Login
            </Link>
          </div>

        </div>

      </section>

    </main>
  )
}

export default FacultyLogin