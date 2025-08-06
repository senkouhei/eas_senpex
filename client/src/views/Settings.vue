<template>
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
                <label for="openai_api_key" class="block text-sm font-medium text-gray-700">
                  OpenAI API Key
                </label>
                <div class="mt-1">
                  <input
                    type="password"
                    name="openai_api_key"
                    id="openai_api_key"
                    v-model="formData.openai_api_key"
                    class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="sk-..."
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">
                  Your OpenAI API key for resume processing and contact extraction.
                </p>
              </div>

              <div>
                <label for="telnyx_api_key" class="block text-sm font-medium text-gray-700">
                  Telnyx API Key
                </label>
                <div class="mt-1">
                  <input
                    type="password"
                    name="telnyx_api_key"
                    id="telnyx_api_key"
                    v-model="formData.telnyx_api_key"
                    class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="KEY..."
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">
                  Your Telnyx API key for SMS messaging functionality.
                </p>
              </div>

              <div>
                <label for="telnyx_phone_number" class="block text-sm font-medium text-gray-700">
                  Telnyx Phone Number
                </label>
                <div class="mt-1">
                  <input
                    type="tel"
                    name="telnyx_phone_number"
                    id="telnyx_phone_number"
                    v-model="formData.telnyx_phone_number"
                    class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="+1234567890"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">
                  Your Telnyx phone number for sending SMS messages.
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
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid'

const settingsStore = useSettingsStore()

const formData = reactive({
  openai_api_key: '',
  telnyx_api_key: '',
  telnyx_phone_number: ''
})

const saveSettings = async () => {
  await settingsStore.updateSettings(formData)
}

onMounted(async () => {
  await settingsStore.fetchSettings()
  
  // Update form data with fetched settings
  formData.openai_api_key = settingsStore.settings.openai_api_key || ''
  formData.telnyx_api_key = settingsStore.settings.telnyx_api_key || ''
  formData.telnyx_phone_number = settingsStore.settings.telnyx_phone_number || ''
})
</script>