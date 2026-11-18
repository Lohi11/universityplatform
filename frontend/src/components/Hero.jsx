import {
  ArrowRight,
  Play,
  Sparkles,
  CheckCircle2,
  FolderKanban,
  GraduationCap,
  CalendarDays,
  FileText,
  MessageSquareText,
  Clock3,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">

      {/* Ambient background */}
      <div className="hero-grid"></div>

      <div className="hero-orb hero-orb-one"></div>
      <div className="hero-orb hero-orb-two"></div>
      <div className="hero-orb hero-orb-three"></div>


      {/* =========================
          HERO CONTENT
      ========================= */}

      <div className="hero-content">

        <div className="hero-status-pill">
          <span className="hero-status-dot"></span>

          <Sparkles size={13} />

          <span>
            UNIVERSITY PROJECT WORKSPACE
          </span>
        </div>


        <h1>
          Your university project.
          <span>One connected workspace.</span>
        </h1>


        <p className="hero-description">
          Plan your project, connect with faculty,
          track milestones, manage documents and
          turn feedback into progress — all in one
          structured workspace.
        </p>


        <div className="hero-actions">

          <Link
            to="/signup"
            className="hero-primary-button"
          >
            Start Your Project
            <ArrowRight size={17} />
          </Link>

          <a
            href="#how-it-works"
            className="hero-secondary-button"
          >
            <Play size={14} />
            Explore Workflow
          </a>

        </div>


        <div className="hero-trust">

          <div>
            <CheckCircle2 size={14} />
            <span>Project tracking</span>
          </div>

          <div>
            <CheckCircle2 size={14} />
            <span>Faculty guidance</span>
          </div>

          <div>
            <CheckCircle2 size={14} />
            <span>Document management</span>
          </div>

        </div>

      </div>


      {/* =========================
          PRODUCT PREVIEW
      ========================= */}

      <div className="hero-product">

        <div className="product-glow"></div>

        <div className="product-window">

          {/* Browser bar */}

          <div className="product-topbar">

            <div className="product-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="product-address">
              universityproject / workspace
            </div>

            <div className="product-live">
              <span></span>
              Workspace
            </div>

          </div>


          {/* App body */}

          <div className="product-body">

            {/* Sidebar */}

            <aside className="product-sidebar">

              <div className="product-logo">
                <GraduationCap size={16} />
              </div>

              <div className="product-nav-item active">
                <FolderKanban size={14} />
              </div>

              <div className="product-nav-item">
                <GraduationCap size={14} />
              </div>

              <div className="product-nav-item">
                <CalendarDays size={14} />
              </div>

              <div className="product-nav-item">
                <FileText size={14} />
              </div>

              <div className="product-nav-item">
                <MessageSquareText size={14} />
              </div>

            </aside>


            {/* Main */}

            <div className="product-main">

              <div className="product-heading">

                <div>
                  <span>STUDENT WORKSPACE</span>

                  <h3>
                    Project overview
                  </h3>
                </div>

                <div className="product-user">
                  S
                </div>

              </div>


              {/* Stats */}

              <div className="product-stats">

                <div className="product-stat">

                  <div className="stat-icon blue">
                    <FolderKanban size={15} />
                  </div>

                  <span>
                    PROJECT STATUS
                  </span>

                  <strong>
                    In Progress
                  </strong>

                  <div className="stat-progress">
                    <div></div>
                  </div>

                </div>


                <div className="product-stat">

                  <div className="stat-icon cyan">
                    <CalendarDays size={15} />
                  </div>

                  <span>
                    MILESTONES
                  </span>

                  <strong>
                    3 of 5 completed
                  </strong>

                  <div className="stat-progress cyan">
                    <div></div>
                  </div>

                </div>


                <div className="product-stat">

                  <div className="stat-icon green">
                    <CheckCircle2 size={15} />
                  </div>

                  <span>
                    GUIDANCE
                  </span>

                  <strong>
                    Accepted
                  </strong>

                  <div className="stat-status">
                    <span></span>
                    Faculty connected
                  </div>

                </div>

              </div>


              {/* Project journey */}

              <div className="product-journey">

                <div className="product-journey-header">

                  <div>
                    <span>
                      PROJECT JOURNEY
                    </span>

                    <strong>
                      Your progress
                    </strong>
                  </div>

                  <small>
                    4 / 5
                  </small>

                </div>


                <div className="journey-track">

                  <div className="journey-line"></div>

                  <div className="journey-item completed">

                    <div className="journey-dot">
                      <CheckCircle2 size={11} />
                    </div>

                    <span>
                      Project
                    </span>

                  </div>


                  <div className="journey-item completed">

                    <div className="journey-dot">
                      <CheckCircle2 size={11} />
                    </div>

                    <span>
                      Guidance
                    </span>

                  </div>


                  <div className="journey-item completed">

                    <div className="journey-dot">
                      <CheckCircle2 size={11} />
                    </div>

                    <span>
                      Milestones
                    </span>

                  </div>


                  <div className="journey-item active">

                    <div className="journey-dot">
                      <FileText size={11} />
                    </div>

                    <span>
                      Documents
                    </span>

                  </div>


                  <div className="journey-item">

                    <div className="journey-dot">
                      <Clock3 size={11} />
                    </div>

                    <span>
                      Complete
                    </span>

                  </div>

                </div>

              </div>


              {/* Bottom cards */}

              <div className="product-bottom">

                <div className="bottom-card">

                  <div className="bottom-card-icon">
                    <FileText size={14} />
                  </div>

                  <div>
                    <span>
                      DOCUMENTS
                    </span>

                    <strong>
                      8 files uploaded
                    </strong>
                  </div>

                </div>


                <div className="bottom-card">

                  <div className="bottom-card-icon feedback">
                    <MessageSquareText size={14} />
                  </div>

                  <div>
                    <span>
                      FEEDBACK
                    </span>

                    <strong>
                      2 items to review
                    </strong>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* Floating notification */}

        <div className="hero-float guidance-float">

          <div className="float-icon">
            <GraduationCap size={16} />
          </div>

          <div>
            <span>
              FACULTY GUIDANCE
            </span>

            <strong>
              Request accepted
            </strong>
          </div>

          <CheckCircle2
            size={15}
            className="float-success"
          />

        </div>


        {/* Floating progress */}

        <div className="hero-float progress-float">

          <span>
            PROJECT PROGRESS
          </span>

          <strong>
            78%
          </strong>

          <div className="float-progress">
            <div></div>
          </div>

        </div>

      </div>

    </section>
  )
}

export default Hero