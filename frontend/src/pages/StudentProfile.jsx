import { useState } from 'react'
import {
  Building2,
  Check,
  Edit3,
  GraduationCap,
  Hash,
  Mail,
  User,
  X,
} from 'lucide-react'

import './StudentProfile.css'

function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false)

  const [profile, setProfile] = useState({
    name: 'Lohith Kumar',
    studentId: 'STU001',
    email: 'lohith@university.edu',
    department: 'Information Technology',
    skills: 'Python, React, MySQL',
  })

  const [editProfile, setEditProfile] = useState(profile)

  const handleEdit = () => {
    setEditProfile(profile)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditProfile(profile)
    setIsEditing(false)
  }

  const handleSave = () => {
    setProfile(editProfile)
    setIsEditing(false)
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setEditProfile((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // PROFILE COMPLETENESS
  const profileFields = [
    profile.name,
    profile.email,
    profile.department,
    profile.skills,
  ]

  const completedFields = profileFields.filter(
    (field) => field && field.trim() !== ''
  ).length

  const profileCompletion = Math.round(
    (completedFields / profileFields.length) * 100
  )

  return (
    <section className="student-profile-page">

      {/* PAGE HEADER */}
      <div className="student-profile-page-header">

        <div>
          <span className="student-profile-eyebrow">
            ACCOUNT
          </span>

          <h1>My Profile</h1>

          <p>
            Manage your student information and academic
            profile details.
          </p>
        </div>

        {!isEditing ? (
          <button
            className="student-profile-edit-button"
            onClick={handleEdit}
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        ) : (
          <div className="student-profile-action-group">

            <button
              className="student-profile-cancel-button"
              onClick={handleCancel}
            >
              <X size={16} />
              Cancel
            </button>

            <button
              className="student-profile-save-button"
              onClick={handleSave}
            >
              <Check size={16} />
              Save Changes
            </button>

          </div>
        )}

      </div>


      {/* PROFILE HERO */}
      <div className="student-profile-hero">

        <div className="student-profile-hero-left">

          <div className="student-profile-large-avatar">
            <User size={34} />
          </div>

          <div className="student-profile-hero-info">

            <h2>{profile.name}</h2>

            <div className="student-profile-meta">

              <span>
                <Hash size={13} />
                {profile.studentId}
              </span>

              <span>
                <Building2 size={13} />
                {profile.department}
              </span>

            </div>

          </div>

        </div>


        <div className="student-profile-status">

          <span className="student-profile-status-dot"></span>

          <div>
            <strong>Student Account</strong>
            <span>Workspace active</span>
          </div>

        </div>

      </div>


      {/* PROFILE CONTENT */}
      <div className="student-profile-grid">


        {/* PERSONAL INFORMATION */}
        <div className="student-profile-card">

          <div className="student-profile-card-header">

            <div>
              <span className="student-profile-card-label">
                PERSONAL INFORMATION
              </span>

              <h3>Basic Details</h3>
            </div>

            <span className="student-profile-card-icon">
              <User size={17} />
            </span>

          </div>


          <div className="student-profile-fields">

            {/* NAME */}
            <div className="student-profile-field">

              <label htmlFor="name">
                Full name
              </label>

              {isEditing ? (
                <div className="student-profile-input">

                  <User size={16} />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={editProfile.name}
                    onChange={handleChange}
                  />

                </div>
              ) : (
                <div className="student-profile-value">
                  <User size={16} />
                  <span>{profile.name}</span>
                </div>
              )}

            </div>


            {/* STUDENT ID */}
            <div className="student-profile-field">

              <label htmlFor="studentId">
                Student ID
              </label>

              <div className="student-profile-value disabled">
                <Hash size={16} />
                <span>{profile.studentId}</span>
              </div>

              {isEditing && (
                <small>
                  Student ID cannot be changed.
                </small>
              )}

            </div>


            {/* EMAIL */}
            <div className="student-profile-field">

              <label htmlFor="email">
                University email
              </label>

              {isEditing ? (
                <div className="student-profile-input">

                  <Mail size={16} />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={editProfile.email}
                    onChange={handleChange}
                  />

                </div>
              ) : (
                <div className="student-profile-value">
                  <Mail size={16} />
                  <span>{profile.email}</span>
                </div>
              )}

            </div>


            {/* DEPARTMENT */}
            <div className="student-profile-field">

              <label htmlFor="department">
                Department
              </label>

              {isEditing ? (
                <div className="student-profile-input">

                  <Building2 size={16} />

                  <select
                    id="department"
                    name="department"
                    value={editProfile.department}
                    onChange={handleChange}
                  >
                    <option>
                      Information Technology
                    </option>

                    <option>
                      Computer Science
                    </option>

                    <option>
                      Electronics & Communication
                    </option>

                    <option>
                      Electrical Engineering
                    </option>

                    <option>
                      Mechanical Engineering
                    </option>

                    <option>
                      Civil Engineering
                    </option>

                    <option>
                      Other
                    </option>
                  </select>

                </div>
              ) : (
                <div className="student-profile-value">
                  <Building2 size={16} />
                  <span>{profile.department}</span>
                </div>
              )}

            </div>

          </div>

        </div>


        {/* ACADEMIC PROFILE */}
        <div className="student-profile-card">

          <div className="student-profile-card-header">

            <div>
              <span className="student-profile-card-label">
                ACADEMIC PROFILE
              </span>

              <h3>Skills & Interests</h3>
            </div>

            <span className="student-profile-card-icon">
              <GraduationCap size={17} />
            </span>

          </div>


          <div className="student-profile-skills-section">

            <label htmlFor="skills">
              Technical skills
            </label>

            {isEditing ? (
              <textarea
                id="skills"
                name="skills"
                value={editProfile.skills}
                onChange={handleChange}
                placeholder="Example: Python, React, MySQL"
                rows="4"
              />
            ) : (
              <div className="student-profile-skills">

                {profile.skills
                  ? profile.skills
                      .split(',')
                      .filter((skill) => skill.trim() !== '')
                      .map((skill) => (
                        <span key={skill.trim()}>
                          {skill.trim()}
                        </span>
                      ))
                  : (
                    <span className="student-profile-empty-skill">
                      No skills added
                    </span>
                  )}

              </div>
            )}

            <p>
              Add the technologies and skills you currently
              use for your academic projects.
            </p>

          </div>


          {/* PROFILE COMPLETENESS */}
          <div className="student-profile-completeness">

            <div className="student-profile-completeness-header">

              <span>Profile completeness</span>

              <strong>{profileCompletion}%</strong>

            </div>

            <div className="student-profile-progress">
              <span
                style={{
                  width: `${profileCompletion}%`,
                }}
              ></span>
            </div>

            <p>
              {profileCompletion === 100
                ? 'Your basic student profile is complete.'
                : 'Complete your profile to improve your profile completeness.'}
            </p>

          </div>

        </div>

      </div>


      {/* ACCOUNT INFORMATION */}
      <div className="student-profile-account-card">

        <div className="student-profile-account-icon">
          <GraduationCap size={18} />
        </div>

        <div className="student-profile-account-content">

          <span className="student-profile-card-label">
            UNIVERSITY PROJECT ACCOUNT
          </span>

          <h3>
            Your profile is connected to your project workspace.
          </h3>

          <p>
            Your student information will be used across
            your project, faculty guidance, milestones,
            documents and feedback.
          </p>

        </div>

        <div className="student-profile-account-badge">
          Active
        </div>

      </div>

    </section>
  )
}

export default StudentProfile