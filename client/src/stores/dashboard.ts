import { defineStore } from 'pinia'
import axios from 'axios'
import { reactive } from 'vue'

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
    },
    botStatusMap: reactive({
      'whole': false,
      'gmail_fetch_bot.js': false,
      'resume_download_link_bot.js': false,
      'contact_info_extraction_bot.js': false,
      'twilio_sms_bot.js': false,
    })
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
    },
    setBotStatusMap(statusMap: Record<string, boolean>) {
      Object.assign(this.botStatusMap, statusMap)
    },
    setStats(stats: Partial<typeof this.stats>) {
      Object.assign(this.stats, stats)
    }
  }
})