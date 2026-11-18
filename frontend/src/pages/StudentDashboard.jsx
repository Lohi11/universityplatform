import {
  ArrowRight,
  CalendarDays,
  FolderKanban,
  Plus,
  Target,
  Users,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import './StudentDashboard.css'


function StudentDashboard() {
  return (
    <main className="dashboard-page">

      {/* =====================================================
          DASHBOARD HEADER
      ====================================================== */}

      <section className="dashboard-header">

        <div className="dashboard-header-content">

          <span className="dashboard-eyebrow">
            STUDENT WORKSPACE
          </span>

          <h1>
            Welcome back, Student.
          </h1>

          <p>
            Manage your university project, faculty guidance,
            milestones, documents and feedback from one
            connected workspace.
          </p>

        </div>


        <Link
          to="/student/project/create"
          className="dashboard-create-button"
        >
          <Plus size={17} />

          <span>
            Create Project
          </span>

          <ArrowRight size={16} />
        </Link>

      </section>


      {/* =====================================================
          OVERVIEW
      ====================================================== */}

      <section className="dashboard-overview">


        {/* CURRENT PROJECT */}

        <div className="overview-card">

          <div className="overview-card-top">

            <span className="overview-icon purple">
              <FolderKanban size={20} />
            </span>

            <span className="status-badge">
              Not Started
            </span>

          </div>


          <div className="overview-content">

            <span>
              CURRENT PROJECT
            </span>

            <h2>
              No project created
            </h2>

            <p>
              Create your university project to begin
              your project workspace.
            </p>

          </div>

        </div>


        {/* PROJECT PROGRESS */}

        <div className="overview-card">

          <div className="overview-card-top">

            <span className="overview-icon blue">
              <Target size={20} />
            </span>

            <span className="progress-percent">
              0%
            </span>

          </div>


          <div className="overview-content">

            <span>
              PROJECT PROGRESS
            </span>

            <h2>
              Getting started
            </h2>

            <div className="progress-bar">

              <div
                className="progress-fill"
                style={{
                  width: '0%',
                }}
              />

            </div>

            <p>
              Your progress will appear here once your
              project and milestones are created.
            </p>

          </div>

        </div>


      </section>


      {/* =====================================================
          QUICK ACCESS
      ====================================================== */}

      <section className="dashboard-section">

        <div className="section-heading">

          <span className="section-label">
            QUICK ACCESS
          </span>

          <h2>
            Your project workspace
          </h2>

        </div>


        <div className="dashboard-cards">


          {/* PROJECT */}

          <div className="dashboard-card">

            <span className="card-icon purple">
              <FolderKanban size={20} />
            </span>

            <div className="card-content">

              <span>
                PROJECT
              </span>

              <h3>
                Manage Project
              </h3>

              <p>
                Create and manage your project title,
                problem statement, objectives, technologies
                and description.
              </p>

            </div>

            <Link
              to="/student/project"
              className="card-arrow"
              aria-label="Manage project"
            >
              <ArrowRight size={16} />
            </Link>

          </div>


          {/* FACULTY GUIDANCE */}

          <div className="dashboard-card">

            <span className="card-icon green">
              <Users size={20} />
            </span>

            <div className="card-content">

              <span>
                FACULTY GUIDANCE
              </span>

              <h3>
                Request Guidance
              </h3>

              <p>
                Connect with a faculty member and track
                your guidance request.
              </p>

            </div>

            <Link
              to="/student/guidance"
              className="card-arrow"
              aria-label="Request faculty guidance"
            >
              <ArrowRight size={16} />
            </Link>

          </div>


          {/* MILESTONES */}

          <div className="dashboard-card">

            <span className="card-icon orange">
              <CalendarDays size={20} />
            </span>

            <div className="card-content">

              <span>
                MILESTONES
              </span>

              <h3>
                Track Progress
              </h3>

              <p>
                View milestones, deadlines and your
                current project progress.
              </p>

            </div>

            <Link
              to="/student/milestones"
              className="card-arrow"
              aria-label="Track milestones"
            >
              <ArrowRight size={16} />
            </Link>

          </div>


        </div>

      </section>


      {/* =====================================================
          PROJECT JOURNEY
      ====================================================== */}

      <section className="dashboard-journey-card">


        {/* JOURNEY HEADER */}

        <div className="dashboard-journey-header">

          <div>

            <span className="section-label">
              PROJECT JOURNEY
            </span>

            <h2>
              From idea to completion
            </h2>

          </div>

          <span className="dashboard-journey-status">
            Your journey starts here
          </span>

        </div>


        {/* JOURNEY TIMELINE */}

        <div className="dashboard-journey-timeline">

          <div className="dashboard-journey-track"></div>


          {/* 01 */}

          <div className="dashboard-journey-step active">

            <span className="dashboard-journey-dot">
              01
            </span>

            <span className="dashboard-journey-label">
              Create Project
            </span>

          </div>


          {/* 02 */}

          <div className="dashboard-journey-step">

            <span className="dashboard-journey-dot">
              02
            </span>

            <span className="dashboard-journey-label">
              Request Guidance
            </span>

          </div>


          {/* 03 */}

          <div className="dashboard-journey-step">

            <span className="dashboard-journey-dot">
              03
            </span>

            <span className="dashboard-journey-label">
              Milestones
            </span>

          </div>


          {/* 04 */}

          <div className="dashboard-journey-step">

            <span className="dashboard-journey-dot">
              04
            </span>

            <span className="dashboard-journey-label">
              Documents
            </span>

          </div>


          {/* 05 */}

          <div className="dashboard-journey-step">

            <span className="dashboard-journey-dot">
              05
            </span>

            <span className="dashboard-journey-label">
              Feedback
            </span>

          </div>


          {/* 06 */}

          <div className="dashboard-journey-step">

            <span className="dashboard-journey-dot">
              06
            </span>

            <span className="dashboard-journey-label">
              Completed
            </span>

          </div>


        </div>


      </section>


    </main>
  )
}


export default StudentDashboard