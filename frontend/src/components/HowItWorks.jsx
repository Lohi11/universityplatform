import {
  Plus,
  GraduationCap,
  CheckCircle2,
  CalendarDays,
  FileUp,
  MessageSquareText,
  Flag,
  ArrowRight,
} from 'lucide-react'

import './HowItWorks.css'

function HowItWorks() {
  return (
    <section className="how-section" id="how-it-works">

      {/* =========================
          HEADER
      ========================= */}

      <div className="how-header">

        <div className="how-eyebrow">
          <span></span>
          HOW IT WORKS
        </div>

        <h2>
          A simple path from
          <span> idea to completion.</span>
        </h2>

        <p>
          Follow a clear project workflow without losing track of guidance,
          deadlines, documents or feedback.
        </p>

      </div>


      {/* =========================
          WORKFLOW PANEL
      ========================= */}

      <div className="how-panel">

        <div className="how-panel-glow"></div>

        <div className="how-panel-top">

          <div>
            <span>PROJECT WORKFLOW</span>

            <strong>
              Your project, step by step
            </strong>
          </div>

          <div className="how-panel-status">
            <span></span>
            7 connected stages
          </div>

        </div>


        {/* =========================
            TIMELINE
        ========================= */}

        <div className="how-timeline">

          <div className="timeline-line">
            <div></div>
          </div>


          {/* STEP 1 */}
          <div className="how-step active">

            <div className="how-step-marker">
              <Plus size={17} />
            </div>

            <div className="how-step-content">

              <div className="how-step-number">
                01
              </div>

              <span>
                START
              </span>

              <h3>
                Create your project
              </h3>

              <p>
                Add your project title, problem statement, objectives,
                description and technologies.
              </p>

            </div>

          </div>


          {/* STEP 2 */}
          <div className="how-step">

            <div className="how-step-marker">
              <GraduationCap size={17} />
            </div>

            <div className="how-step-content">

              <div className="how-step-number">
                02
              </div>

              <span>
                CONNECT
              </span>

              <h3>
                Request faculty guidance
              </h3>

              <p>
                Send a guidance request to a faculty member and wait for
                acceptance or rejection.
              </p>

            </div>

          </div>


          {/* STEP 3 */}
          <div className="how-step">

            <div className="how-step-marker">
              <CheckCircle2 size={17} />
            </div>

            <div className="how-step-content">

              <div className="how-step-number">
                03
              </div>

              <span>
                APPROVAL
              </span>

              <h3>
                Get connected
              </h3>

              <p>
                Once faculty accepts the request, your project workspace
                becomes ready for guided progress.
              </p>

            </div>

          </div>


          {/* STEP 4 */}
          <div className="how-step">

            <div className="how-step-marker">
              <CalendarDays size={17} />
            </div>

            <div className="how-step-content">

              <div className="how-step-number">
                04
              </div>

              <span>
                PLAN
              </span>

              <h3>
                Follow milestones
              </h3>

              <p>
                Faculty creates milestones and deadlines so your project
                work stays structured.
              </p>

            </div>

          </div>


          {/* STEP 5 */}
          <div className="how-step">

            <div className="how-step-marker">
              <FileUp size={17} />
            </div>

            <div className="how-step-content">

              <div className="how-step-number">
                05
              </div>

              <span>
                SUBMIT
              </span>

              <h3>
                Upload documents
              </h3>

              <p>
                Submit proposals, reports and other project documents
                directly inside the workspace.
              </p>

            </div>

          </div>


          {/* STEP 6 */}
          <div className="how-step">

            <div className="how-step-marker">
              <MessageSquareText size={17} />
            </div>

            <div className="how-step-content">

              <div className="how-step-number">
                06
              </div>

              <span>
                IMPROVE
              </span>

              <h3>
                Receive feedback
              </h3>

              <p>
                View faculty corrections and use the feedback to improve
                your project before final verification.
              </p>

            </div>

          </div>


          {/* STEP 7 */}
          <div className="how-step completed">

            <div className="how-step-marker">
              <Flag size={17} />
            </div>

            <div className="how-step-content">

              <div className="how-step-number">
                07
              </div>

              <span>
                COMPLETE
              </span>

              <h3>
                Finish your project
              </h3>

              <p>
                Faculty verifies the completed work and marks the project
                as completed.
              </p>

            </div>

          </div>

        </div>


        {/* =========================
            BOTTOM SUMMARY
        ========================= */}

        <div className="how-summary">

          <div className="how-summary-left">

            <div className="summary-icon">
              <CheckCircle2 size={17} />
            </div>

            <div>
              <strong>
                Everything stays connected.
              </strong>

              <span>
                No scattered project updates.
              </span>
            </div>

          </div>


          <div className="how-summary-flow">

            <span>Project</span>

            <ArrowRight size={13} />

            <span>Guidance</span>

            <ArrowRight size={13} />

            <span>Progress</span>

            <ArrowRight size={13} />

            <span>Completion</span>

          </div>

        </div>

      </div>

    </section>
  )
}

export default HowItWorks