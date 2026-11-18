import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import './CTA.css'

function CTA() {
  return (
    <section className="cta-section">

      {/* Ambient effects */}
      <div className="cta-glow cta-glow-one"></div>
      <div className="cta-glow cta-glow-two"></div>


      <div className="cta-container">

        {/* Top badge */}
        <div className="cta-badge">
          <Sparkles size={13} />
          READY TO GET STARTED?
        </div>


        {/* Main content */}
        <div className="cta-content">

          <div className="cta-icon">
            <GraduationCap size={25} />
          </div>

          <h2>
            Start your project
            <span> with clarity.</span>
          </h2>

          <p>
            Create your project workspace, connect with faculty and
            keep your entire project journey organized from one place.
          </p>


          {/* Actions */}
          <div className="cta-actions">

            <Link
              to="/signup"
              className="cta-primary"
            >
              Create Your Workspace
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/login"
              className="cta-secondary"
            >
              Already have an account?
              <span>Login</span>
            </Link>

          </div>


          {/* Trust points */}
          <div className="cta-points">

            <div>
              <CheckCircle2 size={14} />
              <span>Simple project setup</span>
            </div>

            <div>
              <CheckCircle2 size={14} />
              <span>Faculty guidance workflow</span>
            </div>

            <div>
              <CheckCircle2 size={14} />
              <span>One connected workspace</span>
            </div>

          </div>

        </div>


        {/* Decorative bottom line */}
        <div className="cta-bottom-line">

          <span></span>

          <div>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <span></span>

        </div>

      </div>

    </section>
  )
}

export default CTA