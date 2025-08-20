import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Candidators from '../views/Candidators.vue'
import Settings from '../views/Settings.vue'
import Analytics from '../views/Analytics.vue'

const routes = [
  {
    path: '/',
    component: Dashboard
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/candidators',
    name: 'Candidators',
    component: Candidators
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router