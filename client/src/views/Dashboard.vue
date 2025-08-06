<template>
  <div class="px-4 py-6 sm:px-0">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <div class="flex items-center space-x-4">
        <span class="flex items-center">
          <span v-if="allBotsRunning" class="relative flex h-4 w-4 mr-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
          </span>
          <span v-else class="relative flex h-4 w-4 mr-2">
            <span class="relative inline-flex rounded-full h-4 w-4 bg-gray-400"></span>
          </span>
          <span class="text-sm font-medium" :class="allBotsRunning ? 'text-green-600' : 'text-gray-500'">
            {{ allBotsRunning ? 'Bot is running' : 'Bot is not running' }}
          </span>
        </span>
      </div>
    </div>

    <!-- Progress Steps -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div
        v-for="step in progressSteps"
        :key="step.title"
        @click="goToCandidators(step.filter)"
        class="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
      >
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <component :is="step.icon" class="h-6 w-6 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate flex items-center">
                  {{ step.title }}
                  <span v-if="botStatusMap[step.bot]" class="ml-2 relative flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span v-else class="ml-2 relative flex h-3 w-3">
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
                  </span>
                </dt>
                <dd>
                  <div class="text-lg font-medium text-gray-900">{{ step.value }}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-5 py-3">
          <div class="text-sm">
            <div class="font-medium text-blue-600 hover:text-blue-500">
              View details →
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Overall Progress</h2>
      <div class="space-y-4">
        <div v-for="step in progressSteps" :key="step.title" class="flex items-center">
          <div class="flex-1">
            <div class="flex justify-between text-sm font-medium text-gray-900 mb-1">
              <span>{{ step.title }}</span>
              <span>{{ Math.round((step.value / dashboardStore.stats.totalCandidators) * 100) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(step.value / dashboardStore.stats.totalCandidators) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '../stores/dashboard'
import { useDashboardWebSocket } from '../stores/websocket'
import { ArrowPathIcon, UsersIcon, DocumentTextIcon, PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const dashboardStore = useDashboardStore()

const botStatusMap = reactive({
  'whole': false,
  'gmail_fetch_bot.js': false,
  'resume_download_link_bot.js': false,
  'contact_info_extraction_bot.js': false,
  'twilio_sms_bot.js': false,
})

const progressSteps = computed(() => [
  {
    title: 'All Candidators',
    value: dashboardStore.stats.totalCandidators,
    icon: UsersIcon,
    filter: 'all',
    bot: 'gmail_fetch_bot.js',
  },
  {
    title: 'Fetched Resumes',
    value: dashboardStore.stats.fetchedResumes,
    icon: DocumentTextIcon,
    filter: 'fetched',
    bot: 'resume_download_link_bot.js',
  },
  {
    title: 'Extracted Contact Info',
    value: dashboardStore.stats.extractedContacts,
    icon: PhoneIcon,
    filter: 'extracted',
    bot: 'contact_info_extraction_bot.js',
  },
  {
    title: 'SMS Transferred',
    value: dashboardStore.stats.transferredSMS,
    icon: ChatBubbleLeftRightIcon,
    filter: 'transferred',
    bot: 'twilio_sms_bot.js',
  }
])

const allBotsRunning = computed(() => {
  return botStatusMap['whole'];
});

const goToCandidators = (filter: string) => {
  router.push({ path: '/candidators', query: { filter } })
}

onMounted(() => {
  useDashboardWebSocket((msg) => {
    console.log(msg)
    for (const [key, value] of Object.entries(msg)) {
      if (key === 'whole') {
        const {running, count} = value as {running: boolean, count: number}
        botStatusMap[key] = running
      } else {
        const {running, count} = value as {running: boolean, count: number}
        botStatusMap[key] = running
        switch(key) {
          case 'gmail_fetch_bot.js':
            dashboardStore.stats.totalCandidators = count
            break
          case 'resume_download_link_bot.js':
            dashboardStore.stats.fetchedResumes = count
            break
          case 'contact_info_extraction_bot.js':
            dashboardStore.stats.extractedContacts = count
            break
          case 'twilio_sms_bot.js':
            dashboardStore.stats.transferredSMS = count
            break
        }
      }
    }
  }, () => {
    console.log('WebSocket closed')
    botStatusMap['gmail_fetch_bot.js'] = false
    botStatusMap['resume_download_link_bot.js'] = false
    botStatusMap['contact_info_extraction_bot.js'] = false
    botStatusMap['twilio_sms_bot.js'] = false
  })
})
</script>