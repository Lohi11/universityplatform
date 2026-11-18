import {
  FolderKanban,
  GraduationCap,
  CalendarDays,
  FileText,
  MessageSquareText,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import './Features.css'

function Features() {
  return (
    <section className="features-section" id="features">

      {/* Section heading */}
      <div className="features-heading">

        <div className="features-eyebrow">
          <Sparkles size={13} />
          EVERYTHING IN ONE WORKSPACE
        </div>

        <h2>
          Built around your
          <span> project journey.</span>
        </h2>

        <p>
          Every important part of your university project stays connected —
          from the first idea to final verification.
        </p>

      </div>


      {/* Main feature area */}
      <div className="features-layout">

        {/* Large workspace card */}
        <div className="workspace-feature">

          <div className="workspace-copy">

            <div className="feature-icon-large">
              <FolderKanban size={22} />
            </div>

            <span className="feature-label">
              PROJECT WORKSPACE
            </span>

            <h3>
              See your entire project
              <br />
              <span>at a glance.</span>
            </h3>

            <p>
              Track project status, guidance, milestones, documents and
              feedback from one organized workspace.
            </p>

            <div className="feature-link">
              Explore workspace
              <ArrowUpRight size={15} />
            </div>

          </div>


          {/* Mini dashboard */}
          <div className="mini-dashboard">

            <div className="mini-dashboard-top">

              <div className="mini-brand">
                <span>
                  <GraduationCap size={13} />
                </span>

                <strong>
                  Project Workspace
                </strong>
              </div>

              <div className="mini-user">
                LK
              </div>

            </div>


            <div className="mini-project-head">

              <div>
                <span>
                  CURRENT PROJECT
                </span>

                <strong>
                  Smart Campus Management
                </strong>
              </div>

              <div className="mini-status">
                <span></span>
                In Progress
              </div>

            </div>


            <div className="mini-metrics">

              <div className="mini-metric">

                <div className="mini-metric-icon blue">
                  <FolderKanban size={13} />
                </div>

                <div>
                  <span>PROJECT</span>
                  <strong>78%</strong>
                </div>

              </div>


              <div className="mini-metric">

                <div className="mini-metric-icon cyan">
                  <CalendarDays size={13} />
                </div>

                <div>
                  <span>MILESTONES</span>
                  <strong>3 / 5</strong>
                </div>

              </div>


              <div className="mini-metric">

                <div className="mini-metric-icon green">
                  <CheckCircle2 size={13} />
                </div>

                <div>
                  <span>GUIDANCE</span>
                  <strong>Active</strong>
                </div>

              </div>

            </div>


            <div className="mini-progress">

              <div className="mini-progress-head">
                <span>Project completion</span>
                <strong>78%</strong>
              </div>

              <div className="mini-progress-track">
                <div></div>
              </div>

            </div>


            <div className="mini-activity">

              <div className="mini-activity-title">
                Recent activity
              </div>

              <div className="mini-activity-row">

                <span className="activity-dot blue-dot">
                  <FileText size={11} />
                </span>

                <div>
                  <strong>Document uploaded</strong>
                  <small>Project proposal.pdf</small>
                </div>

                <time>
                  2m
                </time>

              </div>


              <div className="mini-activity-row">

                <span className="activity-dot purple-dot">
                  <MessageSquareText size={11} />
                </span>

                <div>
                  <strong>Faculty feedback</strong>
                  <small>New correction added</small>
                </div>

                <time>
                  1h
                </time>

              </div>

            </div>

          </div>

        </div>


        {/* Right feature cards */}
        <div className="features-side">

          <div className="feature-card guidance-card">

            <div className="feature-card-top">

              <div className="feature-icon">
                <GraduationCap size={18} />
              </div>

              <ArrowUpRight
                size={17}
                className="feature-arrow"
              />

            </div>

            <span>
              FACULTY GUIDANCE
            </span>

            <h3>
              Stay connected
              <br />
              with your faculty.
            </h3>

            <p>
              Request guidance, receive approval and keep faculty feedback
              connected to your project.
            </p>

            <div className="guidance-line">

              <div className="faculty-avatar">
                F
              </div>

              <div className="guidance-line-content">
                <strong>Faculty connected</strong>

                <small>
                  Guidance request accepted
                </small>
              </div>

              <CheckCircle2 size={16} />

            </div>

          </div>


          <div className="feature-card tracking-card">

            <div className="feature-card-top">

              <div className="feature-icon cyan-icon">
                <CalendarDays size={18} />
              </div>

              <ArrowUpRight
                size={17}
                className="feature-arrow"
              />

            </div>

            <span>
              MILESTONES & DEADLINES
            </span>

            <h3>
              Turn work into
              <br />
              clear progress.
            </h3>

            <p>
              Break your project into milestones and always know what needs
              attention next.
            </p>

            <div className="milestone-preview">

              <div className="milestone-item completed">
                <span>
                  <CheckCircle2 size={11} />
                </span>

                <div>
                  <strong>Project proposal</strong>
                  <small>Completed</small>
                </div>
              </div>

              <div className="milestone-item active">
                <span>
                  2
                </span>

                <div>
                  <strong>System design</strong>
                  <small>Due this week</small>
                </div>
              </div>

              <div className="milestone-item">
                <span>
                  3
                </span>

                <div>
                  <strong>Final documentation</strong>
                  <small>Upcoming</small>
                </div>
              </div>

            </div>

          </div>


          <div className="feature-card documents-card">

            <div className="documents-card-content">

              <div className="feature-icon">
                <FileText size={18} />
              </div>

              <div>
                <span>DOCUMENTS</span>

                <h3>
                  Keep every file organized.
                </h3>

                <p>
                  Upload project documents and keep faculty reviews connected.
                </p>
              </div>

            </div>

            <div className="document-stack">

              <div className="document-file">
                <FileText size={13} />
                <span>Project Proposal.pdf</span>
                <CheckCircle2 size={13} />
              </div>

              <div className="document-file second">
                <FileText size={13} />
                <span>System Design.docx</span>
              </div>

            </div>

          </div>

        </div>

      </div>


      {/* Bottom capability strip */}
      <div className="features-strip">

        <div>
          <ShieldCheck size={17} />
          <span>Structured project management</span>
        </div>

        <div>
          <CheckCircle2 size={17} />
          <span>Clear project status</span>
        </div>

        <div>
          <MessageSquareText size={17} />
          <span>Connected faculty feedback</span>
        </div>

        <div>
          <FileText size={17} />
          <span>Centralized documents</span>
        </div>

      </div>

    </section>
  )
}

export default Features