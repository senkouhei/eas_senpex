import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({
  baseURL: ((import.meta as any).env?.VITE_API_URL && (import.meta as any).env?.VITE_API_URL) ?
           'http://' + (import.meta as any).env?.HOST + ":" + (import.meta as any).env?.PORT : 'http://localhost:5000'
})

interface Candidator {
  id: number
  name: string
  email: string
  phone_number: string
  city: string
  state: string
  url: string
  resume_fetched: boolean
  contact_extracted: boolean
  sms_transferred: boolean
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
        this.error = 'Failed to fetch candidators'
        console.error('Error fetching candidators:', error)
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
        this.error = 'Failed to fetch candidators by status'
        console.error('Error fetching candidators by status:', error)
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

    async fetchPaginated({ page = 1, limit = 20, search = '' }) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/api/candidators', { params: { page, limit, search } })
        this.candidators = response.data.data
        this.totalCount = response.data.count
      } catch (error) {
        this.error = 'Failed to fetch candidators'
        console.error('Error fetching paginated candidators:', error)
      } finally {
        this.loading = false
      }
    }
  }
})