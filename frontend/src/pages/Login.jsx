import { useState } from 'react'

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import './Login.css'

import API_BASE_URL from '../api'


function Login() {

  const navigate = useNavigate()


  // =========================================================
  // FORM DATA
  // =========================================================

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')


  // =========================================================
  // UI STATE
  // =========================================================

  const [showPassword, setShowPassword] =
    useState(false)

  const [rememberMe, setRememberMe] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')


  // =========================================================
  // FIELD ERRORS
  // =========================================================

  const [emailError, setEmailError] =
    useState('')

  const [passwordError, setPasswordError] =
    useState('')


  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async () => {

    setError('')

    setEmailError('')

    setPasswordError('')


    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    let hasError = false


    if (!email.trim()) {

      setEmailError(
        'Please enter your university email.'
      )

      hasError = true

    }
    else if (
      !email
        .trim()
        .toLowerCase()
        .endsWith('@srmist.edu.in')
    ) {

      setEmailError(
        'Please use your @srmist.edu.in university email.'
      )

      hasError = true

    }


    if (!password) {

      setPasswordError(
        'Please enter your password.'
      )

      hasError = true

    }


    if (hasError) {
      return
    }


    setLoading(true)


    try {

      // =====================================================
      // STEP 1 — LOGIN
      // =====================================================

      const loginResponse =
        await fetch(
          `${API_BASE_URL}/auth/login`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({

              email:
                email
                  .trim()
                  .toLowerCase(),

              password:
                password,

            }),
          }
        )


      const loginData =
        await loginResponse.json()


      // =====================================================
      // BACKEND ERROR
      // =====================================================

      if (!loginResponse.ok) {

        const detail =
          loginData.detail ||
          'Unable to sign in.'


        const message =
          Array.isArray(detail)
            ? detail
                .map((item) =>
                  item?.msg ||
                  JSON.stringify(item)
                )
                .join(' ')
            : typeof detail === 'object' &&
              detail !== null
              ? (
                  detail.message ||
                  detail.detail ||
                  JSON.stringify(detail)
                )
              : String(detail)


        setError(message)

        return
      }


      // =====================================================
      // STEP 2 — SAVE JWT
      // =====================================================

      const token =
        loginData.access_token


      if (!token) {

        setError(
          'Login succeeded, but no authentication token was received.'
        )

        return
      }


      // =====================================================
      // STEP 3 — VERIFY JWT WITH /auth/me
      // =====================================================

      const meResponse =
        await fetch(
          `${API_BASE_URL}/auth/me`,
          {
            method: 'GET',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )


      const meData =
        await meResponse.json()


      if (!meResponse.ok) {

        setError(
          meData.detail ||
          'Authentication verification failed.'
        )

        return
      }


      // =====================================================
      // STEP 4 — STORE SESSION
      // =====================================================

      const sessionData = {
        access_token:
          token,

        token_type:
          loginData.token_type ||
          'bearer',

        student:
          meData.student ||
          loginData.student,
      }


      const sessionString =
        JSON.stringify(sessionData)


      if (rememberMe) {

        localStorage.setItem(
          'university_project_auth',
          sessionString
        )

      }
      else {

        sessionStorage.setItem(
          'university_project_auth',
          sessionString
        )

      }


      // =====================================================
      // STEP 5 — GO TO STUDENT DASHBOARD
      // =====================================================

      navigate('/student/dashboard')

    }

    catch (err) {

      setError(
        err.message ||
        'Unable to connect to the server.'
      )

    }

    finally {

      setLoading(false)

    }

  }


  // =========================================================
  // FORM SUBMIT
  // =========================================================

  const handleSubmit = (event) => {

    event.preventDefault()

    handleLogin()

  }


  // =========================================================
  // FIELD STYLE
  // =========================================================

  const getInputStyle = (fieldError) => {

    if (!fieldError) {
      return {}
    }


    return {
      borderColor: '#ef4444',

      boxShadow:
        '0 0 0 3px rgba(239, 68, 68, 0.10)',
    }

  }


  return (

    <main className="login-page">


      {/* =====================================================
          LEFT BRAND PANEL
      ====================================================== */}

      <section className="login-brand-panel">

        <div className="login-brand-glow login-glow-one"></div>

        <div className="login-brand-glow login-glow-two"></div>


        <div className="login-brand-content">


          {/* LOGO */}

          <Link
            to="/"
            className="login-logo"
          >

            <span className="login-logo-icon">

              <GraduationCap
                size={21}
              />

            </span>


            <span>

              University<span>
                Project
              </span>

            </span>

          </Link>


          {/* BRAND COPY */}

          <div className="login-brand-copy">


            <div className="login-brand-badge">

              <span className="login-badge-dot"></span>

              STUDENT WORKSPACE

            </div>


            <h1>

              Welcome

              <span>
                {' '}back.
              </span>

            </h1>


            <p>

              Continue managing your university project,
              faculty guidance, milestones, documents and
              feedback from one connected workspace.

            </p>

          </div>


          {/* BENEFITS */}

          <div className="login-benefits">


            <div className="login-benefit">

              <span className="login-benefit-icon">

                <CheckCircle2
                  size={17}
                />

              </span>


              <div>

                <strong>
                  Continue where you left off
                </strong>

                <span>

                  Access your project workspace and current progress.

                </span>

              </div>

            </div>


            <div className="login-benefit">

              <span className="login-benefit-icon">

                <CheckCircle2
                  size={17}
                />

              </span>


              <div>

                <strong>
                  Stay connected with faculty
                </strong>

                <span>

                  View guidance, milestones and project feedback.

                </span>

              </div>

            </div>


            <div className="login-benefit">

              <span className="login-benefit-icon">

                <CheckCircle2
                  size={17}
                />

              </span>


              <div>

                <strong>
                  Keep everything organized
                </strong>

                <span>

                  Documents, deadlines and project updates in one place.

                </span>

              </div>

            </div>


          </div>


        </div>


        {/* FOOTER */}

        <div className="login-brand-footer">

          <span>
            University Project Management Platform
          </span>

          <span>
            2026
          </span>

        </div>


      </section>


      {/* =====================================================
          RIGHT LOGIN PANEL
      ====================================================== */}

      <section className="login-form-panel">


        <div className="login-form-container">


          {/* BACK */}

          <Link
            to="/"
            className="login-back-link"
          >

            <ArrowLeft
              size={16}
            />

            Back to home

          </Link>


          {/* HEADING */}

          <div className="login-heading">


            <div className="login-mobile-logo">

              <span className="login-logo-icon">

                <GraduationCap
                  size={19}
                />

              </span>


              <span>

                University<span>
                  Project
                </span>

              </span>

            </div>


            <span className="login-eyebrow">

              STUDENT LOGIN

            </span>


            <h2>

              Welcome back to your

              <span>
                {' '}workspace.
              </span>

            </h2>


            <p>

              Sign in with your university account to continue
              managing your project.

            </p>

          </div>


          {/* =================================================
              LOGIN FORM
          ================================================== */}

          <form
            className="login-form"
            onSubmit={
              handleSubmit
            }
          >


            {/* =================================================
                EMAIL
            ================================================== */}

            <div className="login-field">


              <label htmlFor="loginEmail">

                University email

              </label>


              <div
                className="login-input-wrapper"
                style={
                  getInputStyle(emailError)
                }
              >

                <Mail
                  size={18}
                />


                <input

                  id="loginEmail"

                  type="email"

                  placeholder="you@srmist.edu.in"

                  autoComplete="email"

                  value={email}

                  onChange={(event) => {

                    setEmail(
                      event.target.value
                    )

                    setEmailError('')

                    setError('')

                  }}

                />

              </div>


              {emailError && (

                <span
                  style={{
                    marginTop: '2px',
                    display: 'block',
                    color: '#ef4444',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >

                  {emailError}

                </span>

              )}

            </div>


            {/* =================================================
                PASSWORD
            ================================================== */}

            <div className="login-field">


              <div className="login-label-row">


                <label htmlFor="loginPassword">

                  Password

                </label>


                <button

                  type="button"

                  className="login-forgot-button"

                  onClick={() =>
                    setError(
                      'Password recovery will be added in the next authentication step.'
                    )
                  }

                >

                  Forgot password?

                </button>


              </div>


              <div
                className="login-input-wrapper"
                style={
                  getInputStyle(
                    passwordError
                  )
                }
              >

                <LockKeyhole
                  size={18}
                />


                <input

                  id="loginPassword"

                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }

                  placeholder="Enter your password"

                  autoComplete="current-password"

                  value={password}

                  onChange={(event) => {

                    setPassword(
                      event.target.value
                    )

                    setPasswordError('')

                    setError('')

                  }}

                />


                <button

                  type="button"

                  className="login-password-toggle"

                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }

                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }

                >

                  {showPassword ? (

                    <EyeOff
                      size={17}
                    />

                  ) : (

                    <Eye
                      size={17}
                    />

                  )}

                </button>

              </div>


              {passwordError && (

                <span
                  style={{
                    marginTop: '2px',
                    display: 'block',
                    color: '#ef4444',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >

                  {passwordError}

                </span>

              )}

            </div>


            {/* =================================================
                REMEMBER ME
            ================================================== */}

            <label
              className="login-remember-row"
            >


              <input

                type="checkbox"

                id="rememberMe"

                checked={
                  rememberMe
                }

                onChange={(event) =>
                  setRememberMe(
                    event.target.checked
                  )
                }

              />


              <span className="login-custom-check"></span>


              <span>

                Keep me signed in on this device

              </span>


            </label>


            {/* =================================================
                ERROR MESSAGE
            ================================================== */}

            {error && (

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '9px',
                  background: '#fef2f2',
                  border:
                    '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '11px',
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >

                {error}

              </div>

            )}


            {/* =================================================
                SUBMIT
            ================================================== */}

            <button

              type="submit"

              className="login-submit"

              disabled={
                loading
              }

            >

              <span>

                {loading
                  ? 'Signing In...'
                  : 'Sign In to Workspace'
                }

              </span>


              <ArrowRight
                size={18}
              />

            </button>


          </form>


          {/* =================================================
              SIGNUP
          ================================================== */}

          <div
            className="login-signup-prompt"
          >

            <span>
              Don't have an account?
            </span>


            <Link to="/signup">

              Create student account

            </Link>

          </div>


          {/* =================================================
              SECURITY
          ================================================== */}

          <div
            className="login-security-note"
          >

            <LockKeyhole
              size={14}
            />


            <span>

              Your credentials are securely verified through
              the University Project authentication system.

            </span>

          </div>


        </div>

      </section>

    </main>

  )
}


export default Login