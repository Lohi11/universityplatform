import { useState } from 'react'

import {
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Milestone,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle,
  UserRound,
  Users,
  X,
} from 'lucide-react'

import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import './StudentLayout.css'


function StudentLayout() {

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()


  // Page titles
  const pageTitles = {
    '/student/dashboard': 'Dashboard',
    '/student/profile': 'My Profile',
    '/student/project': 'My Project',
    '/student/project/create': 'Create Project',
    '/student/guidance': 'Faculty Guidance',
    '/student/milestones': 'Milestones',
    '/student/documents': 'Documents',
    '/student/feedback': 'Feedback',
  }

  const currentPage =
    pageTitles[location.pathname] || 'Student Workspace'


  // Sidebar navigation
  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/student/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'My Project',
      path: '/student/project',
      icon: BookOpen,
    },
    {
      label: 'Guidance',
      path: '/student/guidance',
      icon: Users,
    },
    {
      label: 'Milestones',
      path: '/student/milestones',
      icon: Milestone,
    },
    {
      label: 'Documents',
      path: '/student/documents',
      icon: FileText,
    },
    {
      label: 'Feedback',
      path: '/student/feedback',
      icon: MessageSquare,
    },
  ]


  // Close mobile sidebar after navigation
  const handleNavigation = () => {
    setMobileSidebarOpen(false)
  }


  // STUDENT LOGOUT
  // Clears the saved authentication token from both storages.
  // Works for both the sidebar and profile dropdown buttons.
  const handleLogout = () => {

    localStorage.removeItem('university_project_auth')

    sessionStorage.removeItem('university_project_auth')

    setProfileOpen(false)

    setMobileSidebarOpen(false)

    navigate('/login', {
      replace: true,
    })

  }


  return (
    <div
      className={`student-layout ${
        sidebarCollapsed ? 'sidebar-collapsed' : ''
      } ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}
    >

      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <button
          type="button"
          className="student-mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}


      {/* SIDEBAR */}
      <aside className="student-sidebar">

        <div className="student-sidebar-top">

          {/* BRAND */}
          <div className="student-sidebar-brand">

            <Link
              to="/student/dashboard"
              className="student-sidebar-logo"
              onClick={handleNavigation}
            >
              <span className="student-sidebar-logo-icon">
                <GraduationCap size={20} />
              </span>

              {!sidebarCollapsed && (
                <span className="student-sidebar-brand-name">
                  University<span>Project</span>
                </span>
              )}
            </Link>


            {/* MOBILE CLOSE */}
            <button
              type="button"
              className="student-mobile-close"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>

          </div>


          {/* NAVIGATION */}
          <nav className="student-sidebar-nav">

            <span
              className={`student-nav-section-title ${
                sidebarCollapsed ? 'hidden' : ''
              }`}
            >
              WORKSPACE
            </span>

            {navigationItems.map((item) => {

              const Icon = item.icon

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavigation}
                  className={({ isActive }) =>
                    `student-nav-link ${
                      isActive ? 'active' : ''
                    }`
                  }
                  title={
                    sidebarCollapsed
                      ? item.label
                      : undefined
                  }
                >
                  <span className="student-nav-icon">
                    <Icon size={18} />
                  </span>

                  {!sidebarCollapsed && (
                    <span className="student-nav-label">
                      {item.label}
                    </span>
                  )}

                </NavLink>
              )
            })}


            <div className="student-sidebar-divider" />


            <span
              className={`student-nav-section-title ${
                sidebarCollapsed ? 'hidden' : ''
              }`}
            >
              ACCOUNT
            </span>


            {/* PROFILE NAVIGATION */}
            <NavLink
              to="/student/profile"
              onClick={handleNavigation}
              className={({ isActive }) =>
                `student-nav-link ${
                  isActive ? 'active' : ''
                }`
              }
              title={
                sidebarCollapsed
                  ? 'Profile'
                  : undefined
              }
            >
              <span className="student-nav-icon">
                <UserRound size={18} />
              </span>

              {!sidebarCollapsed && (
                <span className="student-nav-label">
                  Profile
                </span>
              )}

            </NavLink>

          </nav>

        </div>


        {/* SIDEBAR BOTTOM */}
        <div className="student-sidebar-bottom">

          {!sidebarCollapsed && (
            <div className="student-sidebar-status">

              <span className="student-status-icon">
                <CheckCircle2 size={15} />
              </span>

              <div>
                <strong>Workspace Active</strong>
                <span>Your project space is ready</span>
              </div>

            </div>
          )}


          {/* SIDEBAR LOGOUT */}
          <button
            type="button"
            className="student-logout-button"
            onClick={handleLogout}
            title={
              sidebarCollapsed
                ? 'Logout'
                : undefined
            }
          >
            <LogOut size={17} />

            {!sidebarCollapsed && (
              <span>Logout</span>
            )}
          </button>

        </div>

      </aside>


      {/* MAIN AREA */}
      <div className="student-main">


        {/* TOP NAVBAR */}
        <header className="student-navbar">


          {/* LEFT SIDE */}
          <div className="student-navbar-left">

            <button
              type="button"
              className="student-navbar-toggle"
              onClick={() => {
                if (window.innerWidth <= 900) {
                  setMobileSidebarOpen(true)
                } else {
                  setSidebarCollapsed(!sidebarCollapsed)
                }
              }}
              aria-label="Toggle navigation"
            >
              {window.innerWidth <= 900 ? (
                <Menu size={19} />
              ) : sidebarCollapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>


            <div className="student-navbar-title-area">

              <span className="student-navbar-page-title">
                {currentPage}
              </span>

              <span className="student-navbar-breadcrumb">
                Student Workspace
              </span>

            </div>

          </div>


          {/* RIGHT SIDE */}
          <div className="student-navbar-right">


            {/* NOTIFICATION */}
            <button
              type="button"
              className="student-notification-button"
              aria-label="Notifications"
            >
              <Bell size={18} />

              <span className="student-notification-dot" />
            </button>


            <div className="student-navbar-divider" />


            {/* PROFILE */}
            <div className="student-profile-wrapper">

              <button
                type="button"
                className="student-profile-button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
              >

                <span className="student-profile-avatar">
                  <UserCircle size={21} />
                </span>

                <span className="student-profile-info">

                  <strong>Student</strong>

                  <span>
                    Project Workspace
                  </span>

                </span>

                <ChevronDown
                  size={15}
                  className={`student-profile-chevron ${
                    profileOpen ? 'open' : ''
                  }`}
                />

              </button>


              {/* PROFILE MENU */}
              {profileOpen && (
                <div className="student-profile-menu">

                  <div className="student-profile-menu-header">

                    <span className="student-menu-avatar">
                      <UserCircle size={22} />
                    </span>

                    <div>
                      <strong>Student</strong>
                      <span>Student Workspace</span>
                    </div>

                  </div>


                  <div className="student-profile-menu-divider" />


                  {/* MY PROFILE */}
                  <Link
                    to="/student/profile"
                    onClick={() => setProfileOpen(false)}
                    className="student-profile-menu-item"
                  >
                    <UserRound size={16} />
                    <span>My Profile</span>
                  </Link>


                  {/* PROFILE DROPDOWN LOGOUT */}
                  <button
                    type="button"
                    className="student-profile-menu-item logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>

                </div>
              )}

            </div>

          </div>

        </header>


        {/* PAGE CONTENT */}
        <main className="student-content">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default StudentLayout