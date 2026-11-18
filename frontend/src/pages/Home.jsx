import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Users,
  ArrowRight,
  UserRound,
  UserPlus,
  LogIn,
} from 'lucide-react'

import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import About from '../components/About'
import HowItWorks from '../components/HowItWorks'
import CTA from '../components/CTA'
import Footer from '../components/Footer'
import BackToTop from '../components/BackToTop'

import './Home.css'

function Home() {
  return (
    <div className="home">
      <Navbar />

      <Hero />

      {/* Student and Faculty Portals */}
      <section className="portal-access-section">
        <div className="portal-access-container">

          <div className="portal-access-heading">
            <span className="portal-access-eyebrow">
              CHOOSE YOUR PORTAL
            </span>

            <h2>
              Your project journey starts here
            </h2>

            <p>
              Access your workspace based on your role
              in the university project process.
            </p>
          </div>

          <div className="portal-access-grid">

            {/* Student Portal */}
            <article className="portal-access-card student-portal-card">

              <div className="portal-access-icon student-portal-icon">
                <GraduationCap size={28} />
              </div>

              <span className="portal-role-label">
                FOR STUDENTS
              </span>

              <h3>Student Portal</h3>

              <p>
                Create projects, explore faculty expertise,
                request guidance, manage milestones and
                track feedback in one workspace.
              </p>

              <div className="portal-access-actions">
                <Link
                  to="/login"
                  className="portal-primary-link student-primary-link"
                >
                  <LogIn size={17} />
                  Student Login
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/signup"
                  className="portal-secondary-link"
                >
                  <UserPlus size={16} />
                  Create Student Account
                </Link>
              </div>

            </article>

            {/* Faculty Portal */}
            <article className="portal-access-card faculty-portal-card">

              <div className="portal-access-icon faculty-portal-icon">
                <Users size={28} />
              </div>

              <span className="portal-role-label">
                FOR FACULTY
              </span>

              <h3>Faculty Portal</h3>

              <p>
                Review student project proposals, respond
                to guidance requests, supervise milestones
                and provide academic feedback.
              </p>

              <div className="portal-access-actions">
                <Link
                  to="/faculty/login"
                  className="portal-primary-link faculty-primary-link"
                >
                  <UserRound size={17} />
                  Faculty Login
                  <ArrowRight size={17} />
                </Link>

                <span className="portal-account-note">
                  Faculty accounts require authorized setup.
                </span>
              </div>

            </article>

          </div>

        </div>
      </section>

      <Features />

      <About />

      <HowItWorks />

      <CTA />

      <Footer />

      <BackToTop />
    </div>
  )
}

export default Home