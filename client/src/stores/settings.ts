import { defineStore } from 'pinia'
import axios from 'axios'

interface Settings {
  id?: number
  openai_api_key: string
  telnyx_api_key: string
  telnyx_phone_number: string
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {
      openai_api_key: '',
      telnyx_api_key: '',
      telnyx_phone_number: ''
    } as Settings,
    loading: false,
    error: null as string | null,
    success: false
  }),

  actions: {
    async fetchSettings() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/settings')
        this.settings = response.data
      } catch (error) {
        this.error = 'Failed to fetch settings'
        console.error('Error fetching settings:', error)
      } finally {
        this.loading = false
      }
    },

    async updateSettings(settings: Settings) {
      this.loading = true
      this.error = null
      this.success = false
      
      try {
        const response = await axios.put('/api/settings', settings)
        this.settings = response.data
        this.success = true
        setTimeout(() => { this.success = false }, 3000)
      } catch (error) {
        this.error = 'Failed to update settings'
        console.error('Error updating settings:', error)
      } finally {
        this.loading = false
      }
    }
  }
})