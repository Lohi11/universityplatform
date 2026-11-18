import { Navigate, useLocation } from 'react-router-dom'

function getValidSession(role) {
  const storageKey =
    role === 'faculty'
      ? 'university_faculty_auth'
      : 'university_project_auth'

  const identityKey = role === 'faculty' ? 'faculty' : 'student'

  const storages = [localStorage, sessionStorage]

  for (const storage of storages) {
    const savedSession = storage.getItem(storageKey)

    if (!savedSession) continue

    try {
      const authData = JSON.parse(savedSession)

      if (!authData?.access_token || !authData?.[identityKey]) {
        storage.removeItem(storageKey)
        continue
      }

      // Check whether the JWT has expired.
      const tokenParts = authData.access_token.split('.')

      if (tokenParts.length !== 3) {
        storage.removeItem(storageKey)
        continue
      }

      const payload = tokenParts[1]
      const normalizedPayload = payload
        .replace(/-/g, '+')
        .replace(/_/g, '/')

      const decodedPayload = JSON.parse(
        atob(normalizedPayload)
      )

      if (
        decodedPayload.exp &&
        Date.now() >= decodedPayload.exp * 1000
      ) {
        storage.removeItem(storageKey)
        continue
      }

      return true

    } catch {
      storage.removeItem(storageKey)
    }
  }

  return false
}

function ProtectedRoute({ role, children }) {
  const location = useLocation()
  const isAuthenticated = getValidSession(role)

  if (!isAuthenticated) {
    const loginPath =
      role === 'faculty'
        ? '/faculty/login'
        : '/login'

    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location }}
      />
    )
  }

  return children
}

export default ProtectedRoute