import { defineStore } from 'pinia'
import api from '../api.js'

interface Settings {
  OPENAI_API_KEY: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_ACCOUNT_SID: string
  TWILIO_PHONE_NUMBER: string
  SCRAPERAPI_KEY: string
}


export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {
      OPENAI_API_KEY: '',
      TWILIO_AUTH_TOKEN: '',
      TWILIO_ACCOUNT_SID: '',
      TWILIO_PHONE_NUMBER: '',
      SCRAPERAPI_KEY: '',
      'gmail_fetch_bot.js': 'ON',
      'resume_download_link_bot.js': 'ON',
      'contact_info_extraction_bot.js': 'ON',
      'twilio_sms_bot.js': 'ON',
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
        const response = await api.get('/api/settings')
        this.settings = response.data
      } catch (error) {
        this.error = 'Failed to fetch settings'
      } finally {
        this.loading = false
      }
    },

    async updateSettings(settings: Settings) {
      this.loading = true
      this.error = null
      this.success = false
      
      try {
        const response = await api.put('/api/settings', settings)
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