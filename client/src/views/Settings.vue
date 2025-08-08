<template>
  <div>
    
    <!-- Full-screen modal menu for mobile -->
    <transition name="fade">
      <div v-if="showMenu" class="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center sm:hidden">
        <button class="absolute top-4 right-4 p-2" @click="showMenu = false">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <nav class="flex flex-col space-y-8 text-2xl font-semibold mt-12">
          <router-link to="/dashboard" @click.native="showMenu = false">Dashboard</router-link>
          <router-link to="/candidators" @click.native="showMenu = false">Candidators</router-link>
          <router-link to="/settings" @click.native="showMenu = false">Settings</router-link>
        </nav>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showToast" class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
        Copied to Clipboard
      </div>
    </transition>
    <!-- Main content -->
    <div class="px-4 py-6 sm:px-0">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <div class="px-4 sm:px-0">
            <h3 class="text-lg font-medium leading-6 text-gray-900">API Configuration</h3>
            <p class="mt-1 text-sm text-gray-600">
              Configure your API keys and settings for the candidator dashboard.
            </p>
          </div>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <form @submit.prevent="saveSettings">
            <div class="shadow sm:rounded-md sm:overflow-hidden">
              <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div>
                  <label for="scraperapi_key" class="block text-sm font-medium text-gray-700">
                    ScraperAPI Key
                  </label>
                  <div class="mt-1 flex items-center gap-2">
                    <input
                      :type="showScraperApiKey ? 'text' : 'password'"
                      name="scraperapi_key"
                      id="scraperapi_key"
                      v-model="formData.SCRAPERAPI_KEY"
                      class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                      placeholder="API_KEY..."
                    />
                    <button type="button" @click="copyToClipboard(formData.SCRAPERAPI_KEY)" class="p-2 rounded bg-gray-100 hover:bg-gray-200" title="Copy">
                      <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16h8a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8V6a2 2 0 00-2-2H8a2 2 0 00-2 2v2"/></svg>
                    </button>
                    <button type="button" @click="showScraperApiKey = !showScraperApiKey" class="p-2 rounded bg-gray-100 hover:bg-gray-200" title="View">
                      <svg v-if="showScraperApiKey" class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      <svg v-else class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.94 17.94A10.05 10.05 0 0021.542 12c-1.274-4.057-5.065-7-9.542-7-1.018 0-2.007.127-2.958.366"/></svg>
                    </button>
                  </div>
                  <p class="mt-2 text-sm text-gray-500">
                    Your ScraperAPI key for scraping resume download links.
                  </p>
                </div>

                <div>
                  <label for="openai_api_key" class="block text-sm font-medium text-gray-700">
                    OpenAI API Key
                  </label>
                  <div class="mt-1 flex items-center gap-2">
                    <input
                      :type="showOpenAiKey ? 'text' : 'password'"
                      name="openai_api_key"
                      id="openai_api_key"
                      v-model="formData.OPENAI_API_KEY"
                      class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                      placeholder="sk-..."
                    />
                    <button type="button" @click="copyToClipboard(formData.OPENAI_API_KEY)" class="p-2 rounded bg-gray-100 hover:bg-gray-200" title="Copy">
                      <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16h8a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8V6a2 2 0 00-2-2H8a2 2 0 00-2 2v2"/></svg>
                    </button>
                    <button type="button" @click="showOpenAiKey = !showOpenAiKey" class="p-2 rounded bg-gray-100 hover:bg-gray-200" title="View">
                      <svg v-if="showOpenAiKey" class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      <svg v-else class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.94 17.94A10.05 10.05 0 0021.542 12c-1.274-4.057-5.065-7-9.542-7-1.018 0-2.007.127-2.958.366"/></svg>
                    </button>
                  </div>
                  <p class="mt-2 text-sm text-gray-500">
                    Your OpenAI API key for resume processing and contact extraction.
                  </p>
                </div>

                <div>
                  <label for="twilio_api_key" class="block text-sm font-medium text-gray-700">
                    Twilio API Key
                  </label>
                  <div class="mt-1 flex items-center gap-2">
                    <input
                      :type="showTwilioKey ? 'text' : 'password'"
                      name="twilio_api_key"
                      id="twilio_api_key"
                      v-model="formData.TWILIO_API_KEY"
                      class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                      placeholder="KEY..."
                    />
                    <button type="button" @click="copyToClipboard(formData.TWILIO_API_KEY)" class="p-2 rounded bg-gray-100 hover:bg-gray-200" title="Copy">
                      <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16h8a2 2 0 002-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8V6a2 2 0 00-2-2H8a2 2 0 00-2 2v2"/></svg>
                    </button>
                    <button type="button" @click="showTwilioKey = !showTwilioKey" class="p-2 rounded bg-gray-100 hover:bg-gray-200" title="View">
                      <svg v-if="showTwilioKey" class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      <svg v-else class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.94 17.94A10.05 10.05 0 0021.542 12c-1.274-4.057-5.065-7-9.542-7-1.018 0-2.007.127-2.958.366"/></svg>
                    </button>
                  </div>
                  <p class="mt-2 text-sm text-gray-500">
                    Your Twilio API key for SMS messaging functionality.
                  </p>
                </div>

                <div>
                  <label for="twilio_phone_number" class="block text-sm font-medium text-gray-700">
                    Twilio Phone Number
                  </label>
                  <div class="mt-1">
                    <input
                      type="tel"
                      name="twilio_phone_number"
                      id="twilio_phone_number"
                      v-model="formData.TWILIO_PHONE_NUMBER"
                      class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                      placeholder="+1234567890"
                    />
                  </div>
                  <p class="mt-2 text-sm text-gray-500">
                    Your Twilio phone number for sending SMS messages.
                  </p>
                </div>
              </div>
              
              <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  :disabled="settingsStore.loading"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <span v-if="settingsStore.loading">Saving...</span>
                  <span v-else>Save Settings</span>
                </button>
              </div>
            </div>
          </form>

          <!-- Success Message -->
          <div v-if="settingsStore.success" class="mt-4 rounded-md bg-green-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <CheckCircleIcon class="h-5 w-5 text-green-400" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-green-800">
                  Settings saved successfully!
                </p>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="settingsStore.error" class="mt-4 rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <XCircleIcon class="h-5 w-5 text-red-400" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-red-800">
                  {{ settingsStore.error }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid'

const settingsStore = useSettingsStore()

const formData = reactive({
  SCRAPERAPI_KEY: '',
  OPENAI_API_KEY: '',
  TWILIO_API_KEY: '',
  TWILIO_PHONE_NUMBER: ''
})

const showScraperApiKey = ref(false)
const showOpenAiKey = ref(false)
const showTwilioKey = ref(false)
const showToast = ref(false)

function copyToClipboard(value: string) {
  navigator.clipboard.writeText(value)
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 1500)
}

const saveSettings = async () => {
  await settingsStore.updateSettings(formData)
}

const showMenu = ref(false)

onMounted(async () => {
  await settingsStore.fetchSettings()
  
  // Update form data with fetched settings
  formData.SCRAPERAPI_KEY = settingsStore.settings.SCRAPERAPI_KEY || ''
  formData.OPENAI_API_KEY = settingsStore.settings.OPENAI_API_KEY || ''
  formData.TWILIO_API_KEY = settingsStore.settings.TWILIO_API_KEY || ''
  formData.TWILIO_PHONE_NUMBER = settingsStore.settings.TWILIO_PHONE_NUMBER || ''
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>