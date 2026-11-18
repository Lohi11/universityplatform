import {
  GraduationCap,
  Mail,
  ArrowUp,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import './Footer.css'

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <footer className="footer">

      {/* =========================
          MAIN FOOTER
      ========================= */}

      <div className="footer-main">

        {/* Brand */}

        <div className="footer-brand">

          <Link
            to="/"
            className="footer-logo"
          >

            <span className="footer-logo-icon">
              <GraduationCap size={20} />
            </span>

            <span>
              University<span>Project</span>
            </span>

          </Link>


          <p>
            A structured workspace for managing university projects,
            faculty guidance, milestones, documents and feedback.
          </p>


          {/* Contact */}

          <div className="footer-socials">

            <a
              href="mailto:contact@universityproject.com"
              aria-label="Email"
            >
              <Mail size={15} />
            </a>

          </div>

        </div>


        {/* =========================
            PLATFORM
        ========================= */}

        <div className="footer-column">

          <span className="footer-column-title">
            PLATFORM
          </span>

          <a href="#features">
            Features
          </a>

          <a href="#about">
            About
          </a>

          <a href="#how-it-works">
            How It Works
          </a>

        </div>


        {/* =========================
            ACCOUNT
        ========================= */}

        <div className="footer-column">

          <span className="footer-column-title">
            ACCOUNT
          </span>

          <Link to="/login">
            Login
          </Link>

          <Link to="/signup">
            Create Account
          </Link>

        </div>


        {/* =========================
            PROJECT
        ========================= */}

        <div className="footer-column">

          <span className="footer-column-title">
            PROJECT
          </span>

          <span className="footer-static">
            Project Workspace
          </span>

          <span className="footer-static">
            Faculty Guidance
          </span>

          <span className="footer-static">
            Milestones & Feedback
          </span>

        </div>

      </div>


      {/* =========================
          BOTTOM BAR
      ========================= */}

      <div className="footer-bottom">

        <div className="footer-copyright">
          © 2026 UniversityProject. All rights reserved.
        </div>


        <div className="footer-bottom-links">

          <span>
            Built for university project management
          </span>

          <button
            onClick={scrollToTop}
            className="footer-top"
            aria-label="Back to top"
          >
            <ArrowUp size={14} />
          </button>

        </div>

      </div>

    </footer>
  )
}

export default Footer