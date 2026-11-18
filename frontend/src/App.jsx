import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'

import StudentLayout from './components/StudentLayout'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfile from './pages/StudentProfile'
import StudentProject from './pages/StudentProject'
import CreateProject from './pages/CreateProject'
import StudentGuidance from './pages/StudentGuidance'
import StudentMilestones from './pages/StudentMilestones'
import StudentDocuments from './pages/StudentDocuments'
import StudentFeedback from './pages/StudentFeedback'

import FacultyLogin from './pages/FacultyLogin'
import FacultyLayout from './components/FacultyLayout'
import FacultyDashboard from './pages/FacultyDashboard'
import FacultyMilestones from './pages/FacultyMilestones'
import FacultyDocuments from './pages/FacultyDocuments'
import FacultyFeedback from './pages/FacultyFeedback'

import ProtectedRoute from './components/ProtectedRoute'


function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* PUBLIC PAGES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/faculty/login"
          element={<FacultyLogin />}
        />


        {/* PROTECTED FACULTY WORKSPACE */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute role="faculty">
              <FacultyLayout />
            </ProtectedRoute>
          }
        >

          <Route
            path="dashboard"
            element={<FacultyDashboard />}
          />

          <Route
            path="milestones"
            element={<FacultyMilestones />}
          />

          <Route
            path="documents"
            element={<FacultyDocuments />}
          />

          <Route
            path="feedback"
            element={<FacultyFeedback />}
          />

        </Route>


        {/* PROTECTED STUDENT WORKSPACE */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >

          <Route
            path="dashboard"
            element={<StudentDashboard />}
          />

          <Route
            path="profile"
            element={<StudentProfile />}
          />

          <Route
            path="project"
            element={<StudentProject />}
          />

          <Route
            path="project/create"
            element={<CreateProject />}
          />

          <Route
            path="guidance"
            element={<StudentGuidance />}
          />

          <Route
            path="milestones"
            element={<StudentMilestones />}
          />

          <Route
            path="documents"
            element={<StudentDocuments />}
          />

          <Route
            path="feedback"
            element={<StudentFeedback />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  )
}

export default App