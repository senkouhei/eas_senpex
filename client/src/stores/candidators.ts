import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_BACKEND_API_URL || 'http://localhost:5000'
})

interface Candidator {
  id: number
  name_display: string
  email: string
  phone_number: string
  city: string
  state: string
  url: string
  resume_fetched: number
  contact_extracted: number
  sms_transferred: number
  sms_status: string
  created_at: string
  updated_at: string
}

export const useCandidatorsStore = defineStore('candidators', {
  state: () => ({
    candidators: [] as Candidator[],
    loading: false,
    error: null as string | null,
    totalCount: 0
  }),

  actions: {
    async fetchCandidators() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/api/candidators')
        this.candidators = response.data.data
        this.totalCount = response.data.count
      } catch (error) {
        this.error = 'Failed to fetch candidates'
        console.error('Error fetching candidates:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchByStatus(status: string) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/api/candidators/status/${status}`)
        this.candidators = response.data.data
        this.totalCount = response.data.count
      } catch (error) {
        this.error = 'Failed to fetch candidates by status'
        console.error('Error fetching candidates by status:', error)
      } finally {
        this.loading = false
      }
    },

    async updateCandidator(id: number, data: Partial<Candidator>) {
      try {
        const response = await api.put(`/api/candidators/${id}`, data)
        const index = this.candidators.findIndex(c => c.id === id)
        if (index !== -1) {
          this.candidators[index] = response.data
        }
      } catch (error) {
        this.error = 'Failed to update candidator'
        console.error('Error updating candidator:', error)
      }
    },

    async fetchPaginated({ status = 'all', page = 1, limit = 20, search = '' }) {
      this.loading = true
      this.error = null
      console.log('fetching paginated')
      try {
        let url = '/api/candidators'
        if (status != 'all') {  
          url = `/api/candidators/status/${status}`
        }
        console.log(url)
        const response = await api.get(url, { params: { page, limit, search } })
        this.candidators = response.data.data
        this.totalCount = response.data.count
      } catch (error) {
        this.error = 'Failed to fetch candidates'
        console.error('Error fetching paginated candidates:', error)
      } finally {
        this.loading = false
      }
    }
  }
})