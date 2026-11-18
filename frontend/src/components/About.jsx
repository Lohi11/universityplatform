import {
  Lightbulb,
  GraduationCap,
  CalendarCheck2,
  FileText,
  MessageSquareText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

import './About.css'

function About() {
  return (
    <section className="about-section" id="about">

      {/* =========================
          TOP CONTENT
      ========================= */}

      <div className="about-container">

        <div className="about-intro">

          <div className="about-eyebrow">
            <ShieldCheck size={13} />
            A STRUCTURED WAY TO WORK
          </div>

          <h2>
            Projects become easier
            <span> when everything connects.</span>
          </h2>

          <p>
            University projects often involve multiple steps, people and
            documents. This platform brings those activities together into
            one simple project journey.
          </p>

        </div>


        <div className="about-highlight">

          <div className="highlight-number">
            01
          </div>

          <div>
            <strong>
              One project.
            </strong>

            <span>
              One connected journey.
            </span>
          </div>

        </div>

      </div>


      {/* =========================
          PROJECT LIFECYCLE
      ========================= */}

      <div className="about-workflow">

        <div className="workflow-heading">

          <div>
            <span>
              PROJECT LIFECYCLE
            </span>

            <h3>
              From first idea to final completion.
            </h3>
          </div>

          <p>
            Each stage has a clear purpose and connects naturally
            to the next step.
          </p>

        </div>


        <div className="workflow-line"></div>


        <div className="workflow-grid">

          {/* Step 01 */}
          <div className="workflow-step active">

            <div className="workflow-number">
              01
            </div>

            <div className="workflow-icon">
              <Lightbulb size={19} />
            </div>

            <span>
              START
            </span>

            <h4>
              Create Project
            </h4>

            <p>
              Define your project title, problem, objectives and technologies.
            </p>

          </div>


          <div className="workflow-connector">
            <ArrowRight size={15} />
          </div>


          {/* Step 02 */}
          <div className="workflow-step">

            <div className="workflow-number">
              02
            </div>

            <div className="workflow-icon">
              <GraduationCap size={19} />
            </div>

            <span>
              CONNECT
            </span>

            <h4>
              Faculty Guidance
            </h4>

            <p>
              Request guidance and connect your project with a faculty member.
            </p>

          </div>


          <div className="workflow-connector">
            <ArrowRight size={15} />
          </div>


          {/* Step 03 */}
          <div className="workflow-step">

            <div className="workflow-number">
              03
            </div>

            <div className="workflow-icon">
              <CalendarCheck2 size={19} />
            </div>

            <span>
              PLAN
            </span>

            <h4>
              Milestones
            </h4>

            <p>
              Follow project milestones and stay aware of upcoming deadlines.
            </p>

          </div>


          <div className="workflow-connector">
            <ArrowRight size={15} />
          </div>


          {/* Step 04 */}
          <div className="workflow-step">

            <div className="workflow-number">
              04
            </div>

            <div className="workflow-icon">
              <FileText size={19} />
            </div>

            <span>
              BUILD
            </span>

            <h4>
              Documents
            </h4>

            <p>
              Keep proposals, reports and other project files organized.
            </p>

          </div>


          <div className="workflow-connector">
            <ArrowRight size={15} />
          </div>


          {/* Step 05 */}
          <div className="workflow-step">

            <div className="workflow-number">
              05
            </div>

            <div className="workflow-icon">
              <MessageSquareText size={19} />
            </div>

            <span>
              IMPROVE
            </span>

            <h4>
              Feedback
            </h4>

            <p>
              Receive faculty corrections and use them to improve your work.
            </p>

          </div>


          <div className="workflow-connector">
            <ArrowRight size={15} />
          </div>


          {/* Step 06 */}
          <div className="workflow-step completed">

            <div className="workflow-number">
              06
            </div>

            <div className="workflow-icon">
              <CheckCircle2 size={19} />
            </div>

            <span>
              FINISH
            </span>

            <h4>
              Completion
            </h4>

            <p>
              Faculty verifies the project and marks it as completed.
            </p>

          </div>

        </div>


        {/* Bottom journey bar */}
        <div className="about-journey">

          <div className="journey-status">

            <span className="journey-status-dot"></span>

            <div>
              <strong>
                A clear project journey
              </strong>

              <small>
                Every stage stays connected
              </small>
            </div>

          </div>


          <div className="journey-progress">

            <div className="journey-progress-track">
              <div></div>
            </div>

            <span>
              6 connected stages
            </span>

          </div>

        </div>

      </div>

    </section>
  )
}

export default About