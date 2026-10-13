import React, { Component, lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Skeleton } from './components/ui/Skeleton'
import { AlertCircle } from 'lucide-react'
import { Button } from './components/ui/Button'

// Route-level Error Boundary
class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-2xl p-8 border-2 border-red-300 shadow-warm-md max-w-md">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
            <h2 className="font-serif font-bold text-xl text-forest-900 mb-2">
              Terjadi Kendala Memuat Halaman
            </h2>
            <p className="text-xs text-pine-700 mb-6 font-normal">
              {this.state.error?.message || 'Sistem sedang memulihkan data. Silakan muat ulang halaman.'}
            </p>
            <Button
              size="sm"
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
            >
              Muat Ulang Halaman
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Fallback Loading Skeleton saat chunk di-load
function PageLoadingFallback() {
  return (
    <div className="py-16 max-w-5xl mx-auto px-4 space-y-6">
      <Skeleton className="h-10 w-1/3 rounded-xl" />
      <Skeleton className="h-5 w-2/3 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <Skeleton key={n} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// Lazy Load Pages
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const MenuPage = lazy(() => import('./pages/MenuPage').then(m => ({ default: m.MenuPage })))
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })))
const TrackPage = lazy(() => import('./pages/TrackPage').then(m => ({ default: m.TrackPage })))
const ReservePage = lazy(() => import('./pages/ReservePage').then(m => ({ default: m.ReservePage })))
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })))
const TableQrEntry = lazy(() => import('./pages/TableQrEntry').then(m => ({ default: m.TableQrEntry })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

function RootLayout() {
  return (
    <RouteErrorBoundary>
      <Layout>
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </Layout>
    </RouteErrorBoundary>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'meja/:kode', element: <TableQrEntry /> },
      { path: 'pesan', element: <CartPage /> },
      { path: 'pesanan/:id', element: <TrackPage /> },
      { path: 'riwayat', element: <HistoryPage /> },
      { path: 'reservasi', element: <ReservePage /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
