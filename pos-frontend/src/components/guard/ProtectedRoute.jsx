import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export function ProtectedRoute({ allowedRoles }) {
  const { user, token } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === 'cashier') {
      return <Navigate to="/pos" replace />
    } else if (user.role === 'kitchen') {
      return <Navigate to="/kitchen" replace />
    } else if (user.role === 'admin' || user.role === 'superadmin') {
      return <Navigate to="/admin/reports" replace />
    }
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
