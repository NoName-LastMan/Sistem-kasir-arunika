import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from './components/guard/ProtectedRoute'
import { AdminLayout } from './layouts/AdminLayout'
import { useAuthStore } from './stores/authStore'

// Lazy-loaded pages for sub-second first-paint & minimal client memory footprint
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const POSPage = lazy(() => import('./pages/pos/POSPage').then(m => ({ default: m.POSPage })))
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage').then(m => ({ default: m.OrdersPage })))
const KitchenDisplayPage = lazy(() => import('./pages/kitchen/KitchenDisplayPage').then(m => ({ default: m.KitchenDisplayPage })))
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage').then(m => ({ default: m.ReportsPage })))
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage').then(m => ({ default: m.ProductsPage })))
const IngredientsPage = lazy(() => import('./pages/admin/IngredientsPage').then(m => ({ default: m.IngredientsPage })))
const RecipeManagementPage = lazy(() => import('./pages/admin/RecipeManagementPage').then(m => ({ default: m.RecipeManagementPage })))
const WasteManagementPage = lazy(() => import('./pages/admin/WasteManagementPage').then(m => ({ default: m.WasteManagementPage })))
const TablesPage = lazy(() => import('./pages/admin/TablesPage').then(m => ({ default: m.TablesPage })))
const UsersPage = lazy(() => import('./pages/admin/UsersPage').then(m => ({ default: m.UsersPage })))
const ForecastingPage = lazy(() => import('./pages/admin/ForecastingPage').then(m => ({ default: m.ForecastingPage })))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage })))
const InventoryAdjustPage = lazy(() => import('./pages/admin/InventoryAdjustPage').then(m => ({ default: m.InventoryAdjustPage })))
const ModifiersPage = lazy(() => import('./pages/admin/ModifiersPage').then(m => ({ default: m.ModifiersPage })))
const ReconciliationPage = lazy(() => import('./pages/superadmin/ReconciliationPage').then(m => ({ default: m.ReconciliationPage })))
const AuditLogPage = lazy(() => import('./pages/superadmin/AuditLogPage').then(m => ({ default: m.AuditLogPage })))

function SuspenseFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Memuat antarmuka...</p>
      </div>
    </div>
  )
}

function withSuspense(Component) {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Component />
    </Suspense>
  )
}

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
    element: withSuspense(LoginPage)
  },

  // Kasir & Operational Routes
  {
    element: <ProtectedRoute allowedRoles={['cashier', 'admin', 'superadmin']} />,
    children: [
      { path: '/pos', element: withSuspense(POSPage) },
      { path: '/orders', element: withSuspense(OrdersPage) }
    ]
  },

  // Kitchen Display System (KDS)
  {
    element: <ProtectedRoute allowedRoles={['kitchen', 'admin', 'superadmin']} />,
    children: [
      { path: '/kitchen', element: withSuspense(KitchenDisplayPage) }
    ]
  },

  // Admin & Superadmin Backoffice Suite
  {
    element: <ProtectedRoute allowedRoles={['admin', 'superadmin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin/reports', element: withSuspense(ReportsPage) },
          { path: '/admin/products', element: withSuspense(ProductsPage) },
          { path: '/admin/modifiers', element: withSuspense(ModifiersPage) },
          { path: '/admin/inventory-adjust', element: withSuspense(InventoryAdjustPage) },
          { path: '/admin/ingredients', element: withSuspense(IngredientsPage) },
          { path: '/admin/recipes', element: withSuspense(RecipeManagementPage) },
          { path: '/admin/waste', element: withSuspense(WasteManagementPage) },
          { path: '/admin/tables', element: withSuspense(TablesPage) },
          { path: '/admin/users', element: withSuspense(UsersPage) },
          { path: '/admin/forecasting', element: withSuspense(ForecastingPage) },
          { path: '/admin/settings', element: withSuspense(SettingsPage) }
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
          { path: '/superadmin/reconciliation', element: withSuspense(ReconciliationPage) },
          { path: '/superadmin/audit', element: withSuspense(AuditLogPage) }
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
