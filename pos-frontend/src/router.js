import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    name: 'POS',
    component: () => import('./views/POS.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/kitchen',
    name: 'KitchenDisplay',
    component: () => import('./views/KitchenDisplay.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('./views/Dashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin',
    component: () => import('./layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('./views/admin/AdminDashboard.vue')
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('./views/admin/UserManagement.vue')
      },
      {
        path: 'products',
        name: 'ProductManagement',
        component: () => import('./views/admin/ProductManagement.vue')
      },
      {
        path: 'categories',
        name: 'CategoryManagement',
        component: () => import('./views/admin/CategoryManagement.vue')
      },
      {
        path: 'modifiers',
        name: 'ModifierManagement',
        component: () => import('./views/admin/ModifierManagement.vue')
      },
      {
        path: 'tables',
        name: 'TableManagement',
        component: () => import('./views/admin/TableManagement.vue')
      },
      {
        path: 'inventory',
        name: 'InventoryManagement',
        component: () => import('./views/admin/InventoryManagement.vue')
      },
      {
        path: 'ingredients',
        name: 'IngredientManagement',
        component: () => import('./views/admin/IngredientManagement.vue')
      },
      {
        path: 'recipes',
        name: 'RecipeManagement',
        component: () => import('./views/admin/RecipeManagement.vue')
      },
      {
        path: 'waste',
        name: 'WasteManagement',
        component: () => import('./views/admin/WasteManagement.vue')
      },
      {
        path: 'reconciliation',
        name: 'ReconciliationPage',
        component: () => import('./views/admin/ReconciliationPage.vue'),
        meta: { requiresSuperAdmin: true }
      },
      {
        path: 'owner-monitoring',
        name: 'OwnerMonitoring',
        component: () => import('./views/admin/OwnerMonitoring.vue'),
        meta: { requiresSuperAdmin: true }
      },
      {
        path: 'settings',
        name: 'StoreSettings',
        component: () => import('./views/admin/StoreSettings.vue')
      },
      {
        path: 'reports',
        name: 'AdminReports',
        component: () => import('./views/admin/AdminReports.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Cek autentikasi dan role sebelum navigasi
router.beforeEach((to) => {
  const isAuthenticated = localStorage.getItem('pos_token')
  const userStr = localStorage.getItem('pos_user')
  let userRole = null
  if (userStr) {
    try {
      userRole = JSON.parse(userStr)?.role
    } catch (e) {}
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }
  if (to.meta.requiresGuest && isAuthenticated) {
    return '/'
  }
  // requiresAdmin: admin atau superadmin boleh akses
  if (to.meta.requiresAdmin && !['admin', 'superadmin'].includes(userRole)) {
    alert('Akses ditolak: Menu ini hanya untuk akun Administrator.')
    return '/'
  }
  // requiresSuperAdmin: hanya superadmin yang boleh akses
  if (to.meta.requiresSuperAdmin && userRole !== 'superadmin') {
    alert('Akses ditolak: Menu ini khusus untuk Super Admin (Owner).')
    return '/admin/dashboard'
  }
})

export default router