import { useState } from 'react'

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'

import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import './FacultyLayout.css'


function getFacultyDetails() {
  const savedSession =
    localStorage.getItem('university_faculty_auth') ||
    sessionStorage.getItem('university_faculty_auth')

  if (!savedSession) return null

  try {
    const session = JSON.parse(savedSession)
    return session.faculty || null
  } catch {
    return null
  }
}


function FacultyLayout() {

  const navigate = useNavigate()
  const location = useLocation()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const faculty = getFacultyDetails()


  const pageTitles = {
    '/faculty/dashboard': 'Dashboard & Requests',
    '/faculty/milestones': 'Milestones Management',
    '/faculty/documents': 'Student Documents',
    '/faculty/feedback': 'Feedback Management',
  }

  const currentPage =
    pageTitles[location.pathname] || 'Faculty Workspace'


  const navigationItems = [
    {
      label: 'Dashboard & Requests',
      path: '/faculty/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Milestones',
      path: '/faculty/milestones',
      icon: CalendarDays,
    },
    {
      label: 'Student Documents',
      path: '/faculty/documents',
      icon: FileText,
    },
    {
      label: 'Feedback Management',
      path: '/faculty/feedback',
      icon: MessageSquare,
    },
  ]


  const handleNavigation = () => {
    setMobileSidebarOpen(false)
  }


  const handleLogout = () => {

    localStorage.removeItem('university_faculty_auth')
    sessionStorage.removeItem('university_faculty_auth')

    setMobileSidebarOpen(false)

    navigate('/faculty/login', {
      replace: true,
    })
  }


  return (
    <div
      className={`faculty-layout ${
        sidebarCollapsed ? 'faculty-sidebar-collapsed' : ''
      } ${
        mobileSidebarOpen ? 'faculty-mobile-sidebar-open' : ''
      }`}
    >

      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <button
          type="button"
          className="faculty-mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}


      {/* SIDEBAR */}
      <aside className="faculty-sidebar">

        {/* BRAND */}
        <div className="faculty-sidebar-brand">

          <Link
            to="/faculty/dashboard"
            className="faculty-brand-link"
            onClick={handleNavigation}
          >

            <span className="faculty-brand-icon">
              <GraduationCap size={21} />
            </span>

            {!sidebarCollapsed && (
              <span className="faculty-brand-name">
                University<span>Project</span>
              </span>
            )}

          </Link>


          <button
            type="button"
            className="faculty-mobile-close"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>

        </div>


        {/* NAVIGATION */}
        <nav className="faculty-sidebar-nav">

          <span className="faculty-sidebar-section-label">
            WORKSPACE
          </span>

          {navigationItems.map((item) => {

            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={handleNavigation}
                title={
                  sidebarCollapsed
                    ? item.label
                    : undefined
                }
                className={({ isActive }) =>
                  `faculty-sidebar-link ${
                    isActive ? 'active' : ''
                  }`
                }
              >

                <span className="faculty-sidebar-link-icon">
                  <Icon size={19} />
                </span>

                {!sidebarCollapsed && (
                  <span className="faculty-sidebar-link-label">
                    {item.label}
                  </span>
                )}

                {!sidebarCollapsed && (
                  <span className="faculty-sidebar-link-arrow">
                    <ChevronRight size={15} />
                  </span>
                )}

              </NavLink>
            )
          })}

        </nav>


        {/* FACULTY ACCOUNT */}
        <div className="faculty-sidebar-account">

          <span className="faculty-sidebar-section-label">
            ACCOUNT
          </span>

          <div className="faculty-sidebar-user-card">

            <span className="faculty-sidebar-user-icon">
              <UserRound size={19} />
            </span>

            {!sidebarCollapsed && (
              <div className="faculty-sidebar-user-details">

                <strong>
                  {faculty?.name || 'Faculty Member'}
                </strong>

                <span>
                  {faculty?.department || 'Faculty Account'}
                </span>

              </div>
            )}

          </div>

        </div>


        {/* SIDEBAR FOOTER */}
        <div className="faculty-sidebar-footer">

          {!sidebarCollapsed && (
            <div className="faculty-sidebar-status">

              <span>
                <CheckCircle2 size={16} />
              </span>

              <div>
                <strong>Workspace Active</strong>
                <small>Your faculty space is ready</small>
              </div>

            </div>
          )}


          <button
            type="button"
            className="faculty-sidebar-logout"
            onClick={handleLogout}
            title={
              sidebarCollapsed
                ? 'Logout'
                : undefined
            }
          >

            <LogOut size={18} />

            {!sidebarCollapsed && (
              <span>Logout</span>
            )}

          </button>

        </div>

      </aside>


      {/* MAIN CONTENT */}
      <div className="faculty-layout-main">


        {/* TOP NAVBAR */}
        <header className="faculty-layout-navbar">

          <div className="faculty-layout-navbar-left">

            <button
              type="button"
              className="faculty-layout-toggle"
              onClick={() => {

                if (window.innerWidth <= 900) {
                  setMobileSidebarOpen(true)
                } else {
                  setSidebarCollapsed(!sidebarCollapsed)
                }

              }}
              aria-label="Toggle sidebar"
            >

              {window.innerWidth <= 900
                ? <Menu size={20} />
                : sidebarCollapsed
                  ? <PanelLeftOpen size={20} />
                  : <PanelLeftClose size={20} />
              }

            </button>


            <div className="faculty-layout-page-info">

              <strong>{currentPage}</strong>

              <span>Faculty Workspace</span>

            </div>

          </div>


          {/* FACULTY IDENTITY */}
          <div className="faculty-layout-navbar-right">

            <span className="faculty-navbar-shield">
              <ShieldCheck size={21} />
            </span>

            <div className="faculty-navbar-user">

              <strong>
                {faculty?.name || 'Faculty'}
              </strong>

              <span>
                {faculty?.department || 'Academic Workspace'}
              </span>

            </div>

          </div>

        </header>


        {/* PAGE CONTENT */}
        <main className="faculty-layout-content">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default FacultyLayout