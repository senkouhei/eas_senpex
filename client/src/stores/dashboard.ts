import { defineStore } from 'pinia'
import axios from 'axios'

interface DashboardStats {
  totalCandidators: number
  fetchedResumes: number
  extractedContacts: number
  transferredSMS: number
  lastUpdated: string
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: {
      totalCandidators: 0,
      fetchedResumes: 0,
      extractedContacts: 0,
      transferredSMS: 0,
      lastUpdated: ''
    } as DashboardStats,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchStats() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/dashboard/stats')
        this.stats = response.data
      } catch (error) {
        this.error = 'Failed to fetch dashboard stats'
        console.error('Error fetching stats:', error)
      } finally {
        this.loading = false
      }
    }
  }
})