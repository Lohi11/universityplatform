import { Link } from 'react-router-dom'
import {
  ArrowRight,
  GraduationCap,
  Menu,
} from 'lucide-react'

import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">

      {/* Brand */}
      <Link to="/" className="navbar-brand">

        <span className="navbar-brand-icon">
          <GraduationCap size={21} strokeWidth={2} />
        </span>

        <span className="navbar-brand-name">
          University<span>Project</span>
        </span>

      </Link>

      {/* Navigation Links */}
      <div className="navbar-links">

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

      {/* Portal Actions */}
      <div className="navbar-actions">

        <Link
          to="/login"
          className="navbar-login"
        >
          Student Login
        </Link>

        <Link
          to="/faculty/login"
          className="navbar-login"
        >
          Faculty Login
        </Link>

        <Link
          to="/signup"
          className="navbar-start"
        >
          Student Signup
          <ArrowRight size={15} />
        </Link>

        <button
          className="navbar-menu"
          type="button"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

      </div>

    </nav>
  )
}

export default Navbar