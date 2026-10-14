import React from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from './components/guard/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { POSPage } from './pages/pos/POSPage'
import { OrdersPage } from './pages/orders/OrdersPage'
import { KitchenDisplayPage } from './pages/kitchen/KitchenDisplayPage'
import { AdminLayout } from './layouts/AdminLayout'
import { ReportsPage } from './pages/admin/ReportsPage'
import { ProductsPage } from './pages/admin/ProductsPage'
import { IngredientsPage } from './pages/admin/IngredientsPage'
import { RecipeManagementPage } from './pages/admin/RecipeManagementPage'
import { WasteManagementPage } from './pages/admin/WasteManagementPage'
import { TablesPage } from './pages/admin/TablesPage'
import { UsersPage } from './pages/admin/UsersPage'
import { ForecastingPage } from './pages/admin/ForecastingPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import { InventoryAdjustPage } from './pages/admin/InventoryAdjustPage'
import { ModifiersPage } from './pages/admin/ModifiersPage'
import { ReconciliationPage } from './pages/superadmin/ReconciliationPage'
import { AuditLogPage } from './pages/superadmin/AuditLogPage'
import { useAuthStore } from './stores/authStore'

function RootRedirect() {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (user.role === 'cashier') return <Navigate to="/pos" replace />
  if (user.role === 'kitchen') return <Navigate to="/kitchen" replace />
  return <Navigate to="/admin/reports" replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />
  },
  {
    path: '/login',
    element: <LoginPage />
  },

  // Kasir & Operational Routes
  {
    element: <ProtectedRoute allowedRoles={['cashier', 'admin', 'superadmin']} />,
    children: [
      { path: '/pos', element: <POSPage /> },
      { path: '/orders', element: <OrdersPage /> }
    ]
  },

  // Kitchen Display System (KDS)
  {
    element: <ProtectedRoute allowedRoles={['kitchen', 'admin', 'superadmin']} />,
    children: [
      { path: '/kitchen', element: <KitchenDisplayPage /> }
    ]
  },

  // Admin & Superadmin Backoffice Suite
  {
    element: <ProtectedRoute allowedRoles={['admin', 'superadmin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin/reports', element: <ReportsPage /> },
          { path: '/admin/products', element: <ProductsPage /> },
          { path: '/admin/modifiers', element: <ModifiersPage /> },
          { path: '/admin/inventory-adjust', element: <InventoryAdjustPage /> },
          { path: '/admin/ingredients', element: <IngredientsPage /> },
          { path: '/admin/recipes', element: <RecipeManagementPage /> },
          { path: '/admin/waste', element: <WasteManagementPage /> },
          { path: '/admin/tables', element: <TablesPage /> },
          { path: '/admin/users', element: <UsersPage /> },
          { path: '/admin/forecasting', element: <ForecastingPage /> },
          { path: '/admin/settings', element: <SettingsPage /> }
        ]
      }
    ]
  },

  // Superadmin / Owner Suite
  {
    element: <ProtectedRoute allowedRoles={['superadmin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/superadmin/reconciliation', element: <ReconciliationPage /> },
          { path: '/superadmin/audit', element: <AuditLogPage /> }
        ]
      }
    ]
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
