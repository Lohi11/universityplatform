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
  User,
  Hash,
  Building2,
  Phone,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import './Signup.css'

import API_BASE_URL from '../api'


/* =========================================================
   ERROR TEXT
   Keep this OUTSIDE Signup component.
========================================================= */

function ErrorText({ children }) {

  if (!children) {
    return null
  }

  return (
    <span
      style={{
        display: 'block',
        marginTop: '2px',
        color: '#ef4444',
        fontSize: '11px',
        fontWeight: 600,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  )
}


/* =========================================================
   SIGNUP COMPONENT
========================================================= */

function Signup() {

  const navigate = useNavigate()


  /* =======================================================
     PASSWORD VISIBILITY
  ======================================================= */

  const [showPassword, setShowPassword] =
    useState(false)

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)


  /* =======================================================
     FORM DATA
  ======================================================= */

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    department: '',
    password: '',
    confirmPassword: '',
  })


  /* =======================================================
     EMAIL VERIFICATION
  ======================================================= */

  const [emailOtpSent, setEmailOtpSent] =
    useState(false)

  const [emailVerified, setEmailVerified] =
    useState(false)

  const [emailOtp, setEmailOtp] =
    useState('')

  const [registeredStudentId, setRegisteredStudentId] =
    useState(null)


  /* =======================================================
     VALIDATION ERRORS
  ======================================================= */

  const [errors, setErrors] =
    useState({})


  /* =======================================================
     GENERAL MESSAGES
  ======================================================= */

  const [formError, setFormError] =
    useState('')

  const [otpError, setOtpError] =
    useState('')

  const [message, setMessage] =
    useState('')


  /* =======================================================
     TERMS
  ======================================================= */

  const [termsAccepted, setTermsAccepted] =
    useState(false)


  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(false)


  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  const updateField = (field, value) => {

    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))


    setErrors((previous) => {

      if (!previous[field]) {
        return previous
      }

      const updated = {
        ...previous,
      }

      delete updated[field]

      return updated

    })


    setFormError('')

    setMessage('')
  }


  /* =======================================================
     PHONE CHANGE
  ======================================================= */

  const handlePhoneChange = (event) => {

    const value =
      event.target.value.replace(/\D/g, '')

    updateField(
      'phone',
      value
    )
  }


  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validateForm = () => {

    const newErrors = {}


    /* -------------------------
       FULL NAME
    ------------------------- */

    if (!formData.name.trim()) {

      newErrors.name =
        'Please enter your full name.'

    }


    /* -------------------------
       STUDENT ID
    ------------------------- */

    if (!formData.studentId.trim()) {

      newErrors.studentId =
        'Please enter your Student ID.'

    }


    /* -------------------------
       EMAIL
    ------------------------- */

    if (!formData.email.trim()) {

      newErrors.email =
        'Please enter your university email.'

    }

    else if (
      !formData.email
        .trim()
        .toLowerCase()
        .endsWith('@srmist.edu.in')
    ) {

      newErrors.email =
        'Please use your @srmist.edu.in university email.'

    }


    /* -------------------------
       PHONE
    ------------------------- */

    if (!formData.phone.trim()) {

      newErrors.phone =
        'Please enter your phone number.'

    }

    else if (
      !/^\d{10}$/.test(formData.phone)
    ) {

      newErrors.phone =
        'Please enter a valid 10-digit phone number.'

    }


    /* -------------------------
       DEPARTMENT
    ------------------------- */

    if (!formData.department) {

      newErrors.department =
        'Please select your department.'

    }


    /* -------------------------
       PASSWORD
    ------------------------- */

    if (!formData.password) {

      newErrors.password =
        'Please create a password.'

    }

    else if (
      formData.password.length < 8
    ) {

      newErrors.password =
        'Password must contain at least 8 characters.'

    }


    /* -------------------------
       CONFIRM PASSWORD
    ------------------------- */

    if (!formData.confirmPassword) {

      newErrors.confirmPassword =
        'Please confirm your password.'

    }

    else if (
      formData.password !==
      formData.confirmPassword
    ) {

      newErrors.confirmPassword =
        'Passwords do not match.'

    }


    /* -------------------------
       TERMS
    ------------------------- */

    if (!termsAccepted) {

      newErrors.terms =
        'Please accept the academic project management terms.'

    }


    setErrors(newErrors)


    /* -------------------------
       FOCUS FIRST INVALID FIELD
    ------------------------- */

    const firstError =
      Object.keys(newErrors)[0]


    const fieldIds = {

      name: 'fullName',

      studentId: 'studentId',

      email: 'email',

      phone: 'phone',

      department: 'department',

      password: 'password',

      confirmPassword:
        'confirmPassword',

    }


    if (
      firstError &&
      fieldIds[firstError]
    ) {

      setTimeout(() => {

        document
          .getElementById(
            fieldIds[firstError]
          )
          ?.focus()

      }, 0)

    }


    return (
      Object.keys(newErrors).length === 0
    )
  }


  /* =======================================================
     SEND EMAIL OTP
  ======================================================= */

  const handleSendEmailOTP = async () => {

    setErrors({})

    setFormError('')

    setOtpError('')

    setMessage('')


    /* -------------------------
       VALIDATE ALL DETAILS
    ------------------------- */

    const isValid =
      validateForm()


    if (!isValid) {
      return
    }


    setLoading(true)


    try {

      let studentId =
        registeredStudentId


      /* ===================================================
         REGISTER STUDENT
      =================================================== */

      if (!studentId) {

        const registerResponse =
          await fetch(
            `${API_BASE_URL}/auth/register`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({

                name:
                  formData.name.trim(),

                university_student_id:
                  formData.studentId.trim(),

                email:
                  formData.email
                    .trim()
                    .toLowerCase(),

                phone:
                  formData.phone.trim(),

                department:
                  formData.department,

                password:
                  formData.password,

              }),
            }
          )


        const registerData =
          await registerResponse.json()


        if (!registerResponse.ok) {

          const rawDetail = registerData.detail

const detail = Array.isArray(rawDetail)
  ? rawDetail
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (item?.msg) {
          return item.msg
        }

        if (item?.message) {
          return item.message
        }

        return JSON.stringify(item)
      })
      .join(' ')
  : typeof rawDetail === 'object' &&
      rawDetail !== null
    ? (
        rawDetail.message ||
        rawDetail.detail ||
        JSON.stringify(rawDetail)
      )
    : (
        rawDetail ||
        'Unable to create your account.'
      )


          const lowerDetail =
            String(detail).toLowerCase()


          /* -------------------------
             STUDENT ID ERROR
          ------------------------- */

          if (
            lowerDetail.includes(
              'student id'
            )
          ) {

            setErrors({
              studentId:
                detail,
            })

          }


          /* -------------------------
             EMAIL ERROR
          ------------------------- */

          else if (
            lowerDetail.includes(
              'email'
            )
          ) {

            setErrors({
              email:
                detail,
            })

          }


          /* -------------------------
             PHONE ERROR
          ------------------------- */

          else if (
            lowerDetail.includes(
              'phone'
            )
          ) {

            setErrors({
              phone:
                detail,
            })

          }


          /* -------------------------
             GENERAL ERROR
          ------------------------- */

          else {

            setFormError(
              detail
            )

          }


          return
        }


        studentId =
          registerData.student_id


        setRegisteredStudentId(
          studentId
        )
      }


      /* ===================================================
         SEND EMAIL OTP
      =================================================== */

      const otpResponse =
  await fetch(
    `${API_BASE_URL}/auth/send-email-otp?student_id=${encodeURIComponent(studentId)}`,
    {
      method: 'POST',
    }
  )

      const otpData =
        await otpResponse.json()


      if (!otpResponse.ok) {

        throw new Error(
          otpData.detail ||
          'Unable to send the email OTP.'
        )
      }


      /* -------------------------
         SUCCESS
      ------------------------- */

      setEmailOtpSent(true)

      setMessage(
        'OTP sent successfully to your university email.'
      )

    }

    catch (error) {

      setFormError(
        error.message ||
        'Something went wrong. Please try again.'
      )

    }

    finally {

      setLoading(false)

    }
  }


  /* =======================================================
     VERIFY EMAIL OTP
  ======================================================= */

  const handleVerifyEmailOTP = async () => {

    setOtpError('')

    setFormError('')

    setMessage('')


    /* -------------------------
       NO STUDENT ID
    ------------------------- */

    if (!registeredStudentId) {

      setOtpError(
        'Please click Verify beside your email first.'
      )

      return
    }


    /* -------------------------
       OTP LENGTH
    ------------------------- */

    if (
      emailOtp.length !== 6
    ) {

      setOtpError(
        'Please enter the 6-digit OTP.'
      )

      return
    }


    setLoading(true)


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/auth/verify-email-otp`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({

              student_id:
                registeredStudentId,

              otp:
                emailOtp,

            }),
          }
        )


      const data =
        await response.json()


      if (!response.ok) {

        throw new Error(
          data.detail ||
          'Invalid or expired OTP.'
        )
      }


      /* -------------------------
         VERIFIED
      ------------------------- */

      setEmailVerified(true)

      setEmailOtpSent(false)

      setOtpError('')

      setMessage(
        'Email verified successfully. Your account is now active.'
      )


      setErrors((previous) => {

        const updated = {
          ...previous,
        }

        delete updated.email

        return updated

      })

    }

    catch (error) {

      setOtpError(
        error.message ||
        'Unable to verify the OTP.'
      )

    }

    finally {

      setLoading(false)

    }
  }


  /* =======================================================
     CREATE ACCOUNT
  ======================================================= */

  const handleCreateAccount = () => {

    setFormError('')

    setOtpError('')

    setMessage('')


    /* -------------------------
       VALIDATE FORM
    ------------------------- */

    const isValid =
      validateForm()


    if (!isValid) {
      return
    }


    /* -------------------------
       EMAIL VERIFICATION
    ------------------------- */

    if (!emailVerified) {

      setErrors((previous) => ({
        ...previous,

        email:
          'Please verify your university email before creating your account.',
      }))


      setTimeout(() => {

        document
          .getElementById('email')
          ?.focus()

      }, 0)


      return
    }


    /* -------------------------
       ACCOUNT COMPLETE
    ------------------------- */

    setMessage(
      'Account created successfully. Redirecting to sign in...'
    )


    setTimeout(() => {

      navigate('/login')

    }, 1200)
  }


  /* =======================================================
     ERROR FIELD STYLE
  ======================================================= */

  const getWrapperStyle = (field) => {

    if (!errors[field]) {
      return {}
    }


    return {

      borderColor:
        '#ef4444',

      boxShadow:
        '0 0 0 3px rgba(239, 68, 68, 0.10)',

    }
  }


  /* =======================================================
     JSX
  ======================================================= */

  return (

    <main className="signup-page">


      {/* =====================================================
          LEFT BRAND PANEL
      ====================================================== */}

      <section className="signup-brand-panel">

        <div
          className="signup-brand-glow signup-glow-one"
        />

        <div
          className="signup-brand-glow signup-glow-two"
        />


        <div className="signup-brand-content">


          {/* LOGO */}

          <Link
            to="/"
            className="signup-logo"
          >

            <span className="signup-logo-icon">

              <GraduationCap
                size={21}
              />

            </span>


            <span>

              University
              <span>
                Project
              </span>

            </span>

          </Link>


          {/* BRAND COPY */}

          <div className="signup-brand-copy">

            <div className="signup-brand-badge">

              <span
                className="signup-badge-dot"
              />

              STUDENT WORKSPACE

            </div>


            <h1>

              Turn your

              <span>
                {' '}
                project{' '}
              </span>

              into progress.

            </h1>


            <p>

              Create your student workspace and keep your project,
              faculty guidance, milestones, documents and feedback
              connected in one place.

            </p>

          </div>


          {/* BENEFITS */}

          <div className="signup-benefits">


            <div className="signup-benefit">

              <span
                className="signup-benefit-icon"
              >

                <CheckCircle2
                  size={17}
                />

              </span>


              <div>

                <strong>
                  One connected workspace
                </strong>

                <span>
                  Everything related to your project in one place.
                </span>

              </div>

            </div>


            <div className="signup-benefit">

              <span
                className="signup-benefit-icon"
              >

                <CheckCircle2
                  size={17}
                />

              </span>


              <div>

                <strong>
                  Faculty guidance
                </strong>

                <span>
                  Stay connected with your assigned faculty.
                </span>

              </div>

            </div>


            <div className="signup-benefit">

              <span
                className="signup-benefit-icon"
              >

                <CheckCircle2
                  size={17}
                />

              </span>


              <div>

                <strong>
                  Track project progress
                </strong>

                <span>
                  Manage milestones, documents and feedback.
                </span>

              </div>

            </div>


          </div>


        </div>


        {/* FOOTER */}

        <div className="signup-brand-footer">

          <span>
            University Project Management Platform
          </span>

          <span>
            2026
          </span>

        </div>


      </section>


      {/* =====================================================
          RIGHT FORM PANEL
      ====================================================== */}

      <section className="signup-form-panel">


        <div className="signup-form-container">


          {/* BACK TO HOME */}

          <Link
            to="/"
            className="signup-back-link"
          >

            <ArrowLeft
              size={16}
            />

            Back to home

          </Link>


          {/* HEADING */}

          <div className="signup-heading">


            <div className="signup-mobile-logo">

              <span
                className="signup-logo-icon"
              >

                <GraduationCap
                  size={19}
                />

              </span>


              <span>

                University
                <span>
                  Project
                </span>

              </span>

            </div>


            <span
              className="signup-eyebrow"
            >

              CREATE ACCOUNT

            </span>


            <h2>

              Create your student

              <span>
                {' '}workspace.
              </span>

            </h2>


            <p>

              Enter your academic details to get started with
              your university project workspace.

            </p>

          </div>


          {/* =================================================
              FORM
          ================================================== */}

          <form
            className="signup-form"

            onSubmit={(event) => {
              event.preventDefault()
            }}
          >


            {/* =================================================
                FULL NAME
            ================================================== */}

            <div className="signup-field">

              <label htmlFor="fullName">
                Full name
              </label>


              <div
                className="signup-input-wrapper"
                style={
                  getWrapperStyle('name')
                }
              >

                <User size={18} />


                <input

                  id="fullName"

                  name="name"

                  type="text"

                  placeholder="Enter your full name"

                  autoComplete="name"

                  value={
                    formData.name
                  }

                  onChange={(event) =>
                    updateField(
                      'name',
                      event.target.value
                    )
                  }

                />

              </div>


              <ErrorText>
                {errors.name}
              </ErrorText>

            </div>


            {/* =================================================
                STUDENT ID
            ================================================== */}

            <div className="signup-field">

              <label htmlFor="studentId">
                Student ID
              </label>


              <div
                className="signup-input-wrapper"
                style={
                  getWrapperStyle(
                    'studentId'
                  )
                }
              >

                <Hash size={18} />


                <input

                  id="studentId"

                  name="studentId"

                  type="text"

                  placeholder="Example: STU001"

                  autoComplete="off"

                  value={
                    formData.studentId
                  }

                  onChange={(event) =>
                    updateField(
                      'studentId',
                      event.target.value
                    )
                  }

                />

              </div>


              <ErrorText>
                {errors.studentId}
              </ErrorText>

            </div>


            {/* =================================================
                UNIVERSITY EMAIL
            ================================================== */}

            <div className="signup-field">

              <label htmlFor="email">
                University email
              </label>


              <div
                className="signup-input-wrapper"
                style={
                  getWrapperStyle('email')
                }
              >

                <Mail size={18} />


                <input

                  id="email"

                  name="email"

                  type="email"

                  placeholder="you@srmist.edu.in"

                  autoComplete="email"

                  value={
                    formData.email
                  }

                  onChange={(event) =>
                    updateField(
                      'email',
                      event.target.value
                    )
                  }

                  disabled={
                    emailOtpSent ||
                    emailVerified
                  }

                />


                {!emailVerified && (

                  <button

                    type="button"

                    className="signup-verify-button"

                    onClick={
                      handleSendEmailOTP
                    }

                    disabled={
                      loading
                    }

                  >

                    {loading
                      ? 'Sending'
                      : emailOtpSent
                        ? 'Resend'
                        : 'Verify'
                    }

                  </button>

                )}


                {emailVerified && (

                  <CheckCircle2

                    size={20}

                    className="signup-verified-icon"

                  />

                )}

              </div>


              <ErrorText>
                {errors.email}
              </ErrorText>


              {/* OTP */}

              {emailOtpSent &&
                !emailVerified && (

                  <div
                    className="signup-otp-section"
                  >

                    <div
                      className="signup-otp-row"
                    >

                      <input

                        type="text"

                        inputMode="numeric"

                        maxLength={6}

                        placeholder="Enter 6-digit email OTP"

                        value={
                          emailOtp
                        }

                        onChange={(event) => {

                          setEmailOtp(
                            event.target.value.replace(
                              /\D/g,
                              ''
                            )
                          )

                          setOtpError('')

                        }}

                      />


                      <button

                        type="button"

                        className="signup-otp-verify-button"

                        onClick={
                          handleVerifyEmailOTP
                        }

                        disabled={
                          loading
                        }

                      >

                        {loading
                          ? 'Checking'
                          : 'Verify OTP'
                        }

                      </button>

                    </div>


                    {otpError ? (

                      <span
                        style={{
                          display: 'block',
                          marginTop: '7px',
                          color: '#ef4444',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >

                        {otpError}

                      </span>

                    ) : (

                      <span
                        className="signup-otp-message"
                      >

                        Enter the OTP sent to your university email.

                      </span>

                    )}

                  </div>

                )}


              {emailVerified && (

                <span
                  className="signup-success-message"
                >

                  Email verified successfully

                </span>

              )}

            </div>


            {/* =================================================
                PHONE NUMBER
            ================================================== */}

            <div className="signup-field">

              <label htmlFor="phone">
                Phone number
              </label>


              <div
                className="signup-input-wrapper"
                style={
                  getWrapperStyle('phone')
                }
              >

                <Phone size={18} />


                <span
                  className="signup-phone-prefix"
                >

                  +91

                </span>


                <input

                  id="phone"

                  name="phone"

                  type="tel"

                  placeholder="Enter your 10-digit phone number"

                  autoComplete="tel"

                  maxLength={10}

                  value={
                    formData.phone
                  }

                  onChange={
                    handlePhoneChange
                  }

                />

              </div>


              <ErrorText>
                {errors.phone}
              </ErrorText>

            </div>


            {/* =================================================
                DEPARTMENT
            ================================================== */}

            <div className="signup-field">

              <label htmlFor="department">
                Department
              </label>


              <div
                className="signup-input-wrapper"
                style={
                  getWrapperStyle(
                    'department'
                  )
                }
              >

                <Building2 size={18} />


                <select

                  id="department"

                  name="department"

                  value={
                    formData.department
                  }

                  onChange={(event) =>
                    updateField(
                      'department',
                      event.target.value
                    )
                  }

                >

                  <option
                    value=""
                    disabled
                  >
                    Select your department
                  </option>


                  <option value="Information Technology">
                    Information Technology
                  </option>


                  <option value="Computer Science">
                    Computer Science
                  </option>


                  <option value="Electronics & Communication">
                    Electronics & Communication
                  </option>


                  <option value="Electrical Engineering">
                    Electrical Engineering
                  </option>


                  <option value="Mechanical Engineering">
                    Mechanical Engineering
                  </option>


                  <option value="Civil Engineering">
                    Civil Engineering
                  </option>


                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              <ErrorText>
                {errors.department}
              </ErrorText>

            </div>


            {/* =================================================
                PASSWORD
            ================================================== */}

            <div className="signup-form-row">


              <div className="signup-field">

                <label htmlFor="password">
                  Password
                </label>


                <div
                  className="signup-input-wrapper"
                  style={
                    getWrapperStyle(
                      'password'
                    )
                  }
                >

                  <LockKeyhole
                    size={18}
                  />


                  <input

                    id="password"

                    name="password"

                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }

                    placeholder="Create password"

                    autoComplete="new-password"

                    value={
                      formData.password
                    }

                    onChange={(event) =>
                      updateField(
                        'password',
                        event.target.value
                      )
                    }

                  />


                  <button

                    type="button"

                    className="signup-password-toggle"

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
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}

                  </button>

                </div>


                <ErrorText>
                  {errors.password}
                </ErrorText>

              </div>


              {/* CONFIRM PASSWORD */}

              <div className="signup-field">

                <label htmlFor="confirmPassword">
                  Confirm password
                </label>


                <div
                  className="signup-input-wrapper"
                  style={
                    getWrapperStyle(
                      'confirmPassword'
                    )
                  }
                >

                  <LockKeyhole
                    size={18}
                  />


                  <input

                    id="confirmPassword"

                    name="confirmPassword"

                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }

                    placeholder="Repeat password"

                    autoComplete="new-password"

                    value={
                      formData.confirmPassword
                    }

                    onChange={(event) =>
                      updateField(
                        'confirmPassword',
                        event.target.value
                      )
                    }

                  />


                  <button

                    type="button"

                    className="signup-password-toggle"

                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }

                    aria-label={
                      showConfirmPassword
                        ? 'Hide password'
                        : 'Show password'
                    }

                  >

                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}

                  </button>

                </div>


                <ErrorText>
                  {errors.confirmPassword}
                </ErrorText>

              </div>

            </div>


            {/* =================================================
                TERMS
            ================================================== */}

            <label
              className="signup-check-row"
            >

              <input

                type="checkbox"

                id="academicUse"

                checked={
                  termsAccepted
                }

                onChange={(event) => {

                  const checked =
                    event.target.checked

                  setTermsAccepted(
                    checked
                  )

                  if (checked) {

                    setErrors((previous) => {

                      const updated = {
                        ...previous,
                      }

                      delete updated.terms

                      return updated

                    })

                  }

                }}

              />


              <span
                className="signup-custom-check"
                style={
                  errors.terms
                    ? {
                        borderColor:
                          '#ef4444',
                      }
                    : {}
                }
              />


              <span>

                I am creating this account for academic
                project management.

              </span>

            </label>


            <ErrorText>
              {errors.terms}
            </ErrorText>


            {/* =================================================
                GENERAL ERROR
            ================================================== */}

            {formError && (

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

                {formError}

              </div>

            )}


            {/* =================================================
                SUCCESS
            ================================================== */}

            {message && (

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '9px',
                  background: '#f0fdf4',
                  border:
                    '1px solid #bbf7d0',
                  color: '#16a34a',
                  fontSize: '11px',
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >

                {message}

              </div>

            )}


            {/* =================================================
                CREATE ACCOUNT
            ================================================== */}

            <button

              type="button"

              className="signup-submit"

              onClick={
                handleCreateAccount
              }

              disabled={
                loading
              }

            >

              <span>
                Create Student Account
              </span>


              <ArrowRight
                size={18}
              />

            </button>


          </form>


          {/* LOGIN LINK */}

          <div
            className="signup-login-prompt"
          >

            Already have an account?


            <Link to="/login">

              Sign in

            </Link>

          </div>


          {/* SECURITY NOTE */}

          <div
            className="signup-security-note"
          >

            <LockKeyhole
              size={14}
            />


            <span>

              Your account will be securely connected to
              your university project workspace.

            </span>

          </div>


        </div>

      </section>

    </main>
  )
}


export default Signup