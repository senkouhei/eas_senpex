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
    <!-- Main content -->
    <div class="px-4 py-6 sm:px-0">
      <!-- Responsive filter row: 2 per row on mobile, 4 in one row on desktop -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <input v-model="search" @change="onSearchChange" placeholder="Search by name..." class="border rounded px-2 py-2 w-full min-w-[120px]" />
        <input v-model="cityFilter" @change="onCityChange" placeholder="Filter by city" class="border rounded px-2 py-2 w-full min-w-[120px]" />
        <input v-model="stateFilter" @change="onStateChange" placeholder="Filter by state" class="border rounded px-2 py-2 w-full min-w-[120px]" />
        <input v-model="phoneFilter" @change="onPhoneChange" placeholder="Filter by phone number" class="border rounded px-2 py-2 w-full min-w-[120px]" />
      </div>

      <!-- Progress Filter Buttons and Status Toggle in the same row -->
      <div class="mb-6 overflow-x-auto flex items-center justify-between">
        <nav class="flex space-x-2 min-w-max w-full" aria-label="Tabs" style="-webkit-overflow-scrolling: touch;">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            @click="setActiveTab(tab.key)"
            :class="[
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex-1'
            ]"
          >
            <span class="flex items-center">
              {{ tab.name }}
              <span
                :class="[
                  activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600',
                  'ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium'
                ]"
              >
                {{ tab.count }}
              </span>
              <!-- Show toggle button to the right of the active tab on mobile -->
              <span v-if="activeTab === tab.key" class="ml-2 block sm:hidden">
                <button @click.stop="onStatusFilterChange(statusFilter === '' ? 'success' : statusFilter === 'success' ? 'failed' : '')"
                  :class="[
                    'border rounded px-4 py-1 text-sm font-semibold shadow-sm',
                    statusFilter === 'success' ? 'bg-green-100 text-green-800 border-green-400' :
                    statusFilter === 'failed' ? 'bg-red-100 text-red-800 border-red-400' :
                    'bg-white text-gray-800 border-gray-300'
                  ]">
                  {{ statusFilter === 'success' ? 'Show Success' : statusFilter === 'failed' ? 'Show Failed' : 'Show All' }}
                </button>
              </span>
            </span>
          </button>
        </nav>
        <!-- On desktop, show toggle at far right -->
        <div class="ml-4 hidden sm:block">
          <button @click="onStatusFilterChange(statusFilter === '' ? 'success' : statusFilter === 'success' ? 'failed' : '')"
            :class="[
              'border rounded px-4 py-1 text-sm font-semibold shadow-sm',
              statusFilter === 'success' ? 'bg-green-100 text-green-800 border-green-400' :
              statusFilter === 'failed' ? 'bg-red-100 text-red-800 border-red-400' :
              'bg-white text-gray-800 border-gray-300'
            ]">
            {{ statusFilter === 'success' ? 'Show Success' : statusFilter === 'failed' ? 'Show Failed' : 'Show All' }}
          </button>
        </div>
      </div>

      <!-- Candidators Table -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky-col sticky-col-left bg-gray-50 z-10">
                  <div class="flex items-center">
                    Name
                    <div class="ml-2 relative">
                      <button @click="onSortChange('name')" class="text-xs border rounded px-1 py-0.5 bg-white flex items-center">
                        <span v-if="sortField === 'name' && sortOrder === 'asc'">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l5-5 5 5"/></svg>
                        </span>
                        <span v-else-if="sortField === 'name' && sortOrder === 'dsc'">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5 5 5-5"/></svg>
                        </span>
                        <span v-else>
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5-5 5 5M5 12l5 5 5-5"/></svg>
                        </span>
                      </button>
                    </div>
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    City
                    <div class="ml-2 relative">
                      <button @click="onSortChange('city')" class="text-xs border rounded px-1 py-0.5 bg-white flex items-center">
                        <span v-if="sortField === 'city' && sortOrder === 'asc'">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l5-5 5 5"/></svg>
                        </span>
                        <span v-else-if="sortField === 'city' && sortOrder === 'dsc'">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5 5 5-5"/></svg>
                        </span>
                        <span v-else>
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5-5 5 5M5 12l5 5 5-5"/></svg>
                        </span>
                      </button>
                    </div>
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    State
                    <div class="ml-2 relative">
                      <button @click="onSortChange('state')" class="text-xs border rounded px-1 py-0.5 bg-white flex items-center">
                        <span v-if="sortField === 'state' && sortOrder === 'asc'">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l5-5 5 5"/></svg>
                        </span>
                        <span v-else-if="sortField === 'state' && sortOrder === 'dsc'">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5 5 5-5"/></svg>
                        </span>
                        <span v-else>
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5-5 5 5M5 12l5 5 5-5"/></svg>
                        </span>
                      </button>
                    </div>
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    Gmail Timestamp
                    <div class="ml-2 relative">
                      <button @click="onSortChange('gmail_timestamp')" class="text-xs border rounded px-1 py-0.5 bg-white flex items-center">
                        <span v-if="sortField === 'gmail_timestamp' && sortOrder === 'asc'">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l5-5 5 5"/></svg>
                        </span>
                        <span v-else-if="sortField === 'gmail_timestamp' && sortOrder === 'dsc'">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5 5 5-5"/></svg>
                        </span>
                        <span v-else>
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5-5 5 5M5 12l5 5 5-5"/></svg>
                        </span>
                      </button>
                    </div>
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    SMS Timestamp
                    <div class="ml-2 relative">
                      <button @click="onSortChange('sms_transfered_datetime')" class="text-xs border rounded px-1 py-0.5 bg-white flex items-center">
                        <span v-if="sortField === 'sms_transfered_datetime' && sortOrder === 'asc'">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l5-5 5 5"/></svg>
                        </span>
                        <span v-else-if="sortField === 'sms_transfered_datetime' && sortOrder === 'dsc'">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5 5 5-5"/></svg>
                        </span>
                        <span v-else>
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8l5-5 5 5M5 12l5 5 5-5"/></svg>
                        </span>
                      </button>
                    </div>
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SMS Status
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="candidatorsStore.loading">
                <td :colspan="12" class="p-8 text-center">
                  <div class="animate-pulse">Loading candidates...</div>
                </td>
              </tr>
              <tr v-else-if="candidatorsStore.error">
                <td :colspan="12" class="p-8 text-center text-red-600">
                  {{ candidatorsStore.error }}
                </td>
              </tr>
              <tr v-else-if="!Array.isArray(candidatorsStore.candidators) || candidatorsStore.candidators.length === 0">
                <td :colspan="12" class="p-8 text-center text-gray-500">
                  No candidates found.
                </td>
              </tr>
              <tr v-else v-for="candidator in (Array.isArray(candidatorsStore.candidators) ? candidatorsStore.candidators : [])" :key="candidator.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky-col sticky-col-left bg-white z-10">
                  {{ candidator.name_display }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ candidator.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ candidator.phone_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ candidator.city }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ candidator.state }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(candidator.gmail_timestamp) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(candidator.sms_transfered_datetime) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <button v-if="candidator.sms_text" @click="openMessageModal(candidator)" class="text-blue-600 hover:text-blue-900">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a :href="candidator.url" target="_blank" class="text-blue-600 hover:text-blue-900">
                    View Profile
                  </a>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getSMSStatusClass(candidator.sms_status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ candidator.sms_status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex space-x-1">
                    <span
                      v-if="typeof candidator.resume_fetched === 'number'"
                      :class="candidator.resume_fetched === 1 ? 'bg-green-100 text-green-800' : candidator.resume_fetched === 2 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    >
                      Resume
                    </span>
                    <span
                      v-if="typeof candidator.contact_extracted === 'number'"
                      :class="candidator.contact_extracted === 1 ? 'bg-green-100 text-green-800' : candidator.contact_extracted === 2 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'" 
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                      Contact
                    </span>
                    <span
                      v-if="typeof candidator.sms_transferred === 'number'"
                      :class="candidator.sms_transferred === 1 ? 'bg-green-100 text-green-800' : candidator.sms_transferred === 2 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'" 
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                      SMS
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  <button @click="tryAgain(candidator)" class="border rounded px-2 py-1 text-xs font-semibold bg-white shadow-sm">
                    <template v-if="candidator.resume_fetched === 2 || candidator.contact_extracted === 2 || candidator.sms_transferred === 2">
                      Try again
                    </template>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="flex items-center justify-end mt-4 px-4 pb-4">
        <div class="flex items-center gap-2">
          <label for="page-size" class="text-sm text-gray-600">Page size:</label>
          <select id="page-size" v-model.number="limit" @change="onPageSizeChange" class="border rounded px-2 py-1">
            <option v-for="size in [10, 20, 50, 100]" :key="size" :value="size">{{ size }}</option>
          </select>
        </div>
        <button @click="onPageChange(page - 1)" :disabled="page === 1" class="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
        <span class="mx-2">Page {{ page }}</span>
        <button @click="onPageChange(page + 1)" :disabled="page * limit >= candidatorsStore.totalCount" class="px-2 py-1 border rounded disabled:opacity-50">Next</button>
        <span class="ml-4 text-sm text-gray-500">Total: {{ candidatorsStore.totalCount }}</span>
      </div>
    </div>
    <div v-if="showMessageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button class="absolute top-6 right-6 text-gray-500 hover:text-gray-700" @click="closeMessageModal">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h3 class="text-lg font-semibold mb-4">Message History</h3>
        <div v-if="selectedMessage?.aggregated_messages && Array.isArray(selectedMessage.aggregated_messages)" class="chat-history mb-4">
          <div class="flex justify-end mb-2">
            <div class="chat-bubble chat-bubble-right">
              <span>{{ selectedMessage?.sms_text }}</span>
              <div class="chat-time text-white">{{ formatDate(selectedMessage?.sms_transfered_datetime) }}</div>
            </div>
          </div>
          <div v-for="(msg, idx) in selectedMessage.aggregated_messages" :key="idx" class="mb-2 flex flex-col gap-1">
            <div v-if="msg.message">
              <div class="flex justify-start">
                <div class="chat-bubble chat-bubble-left">
                  <span>{{ msg.message }}</span>
                  <div class="chat-time">{{ formatDate(msg.created_at) }}</div>
                </div>
              </div>
            </div>
            <div v-if="msg.reply">
              <div class="flex justify-end">
                <div class="chat-bubble chat-bubble-right">
                  <span>{{ msg.reply }}</span>
                  <div class="chat-time text-white">{{ formatDate(msg.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-4">
          <textarea
            v-model="newSmsText"
            class="flex-1 border rounded px-2 py-1 resize-none"
            rows="2"
            placeholder="Type your message..."
            :disabled="sendingSms"
          ></textarea>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            @click="sendSms"
            :disabled="sendingSms || !newSmsText.trim()"
          >
            <span v-if="!sendingSms">Send</span>
            <svg v-else class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </button>
        </div>
        <div class="text-xs text-gray-500 mt-2">
          The message which is sent cannot be edited or undone. Please be cautious.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCandidatorsStore } from '../stores/candidators'
import { useDashboardStore } from '../stores/dashboard'
import { useDashboardWebSocket } from '../stores/websocket'
import api from '../api'

const route = useRoute()
const router = useRouter()
const candidatorsStore = useCandidatorsStore()
const dashboardStore = useDashboardStore()

const showMenu = ref(false)

const activeTab = ref('all')

const page = ref(Number(route.query.page) || 1)
const limit = ref(Number(route.query.limit) || 20)
const search = ref(getQueryString(route.query.name))
const cityFilter = ref(getQueryString(route.query.city))
const stateFilter = ref(getQueryString(route.query.state))
const phoneFilter = ref(getQueryString(route.query.phone))
const sortField = ref(getQueryString(route.query.sortField))
const sortOrder = ref(getQueryString(route.query.sortOrder))
const statusFilter = ref(getQueryString(route.query.statusFilter))

function updateQuery(params: Record<string, any>) {
  router.replace({ query: { ...route.query, ...params } })
}

function getQueryString(value: any): string {
  return value !== null && value !== undefined ? String(value) : '';
}

function onSearchChange() {
  updateQuery({ name: search.value, page: 1 })
}
function onCityChange() {
  updateQuery({ city: cityFilter.value, page: 1 })
}
function onStateChange() {
  updateQuery({ state: stateFilter.value, page: 1 })
}
function onPhoneChange() {
  updateQuery({ phone: phoneFilter.value, page: 1 })
}
function onSortChange(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'dsc' : sortOrder.value === 'dsc' ? '' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
  updateQuery({ sortField: sortField.value, sortOrder: sortOrder.value, page: 1 })
}
function onStatusFilterChange(newStatus: string) {
  statusFilter.value = newStatus
  updateQuery({ statusFilter: newStatus, page: 1 })
}
function onPageChange(newPage: number) {
  updateQuery({ page: newPage })
}
function onPageSizeChange(event: Event) {
  const newLimit = Number((event.target as HTMLSelectElement).value);
  updateQuery({ limit: newLimit, page: 1 });
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

watch(
  () => route.query,
  (query) => {
    page.value = Number(query.page) || 1
    limit.value = Number(query.limit) || 20
    search.value = getQueryString(query.name)
    cityFilter.value = getQueryString(query.city)
    stateFilter.value = getQueryString(query.state)
    phoneFilter.value = getQueryString(query.phone)
    sortField.value = getQueryString(query.sortField)
    sortOrder.value = getQueryString(query.sortOrder)
    statusFilter.value = getQueryString(query.statusFilter)
    fetchPaginated()
  },
  { immediate: true }
)

async function fetchPaginated() {
  await candidatorsStore.fetchPaginated({
    status: activeTab.value,
    page: page.value,
    limit: limit.value,
    search: search.value,
    city: cityFilter.value,
    state: stateFilter.value,
    phone: phoneFilter.value,
    sortField: sortField.value,
    sortOrder: sortOrder.value,
    statusFilter: statusFilter.value
  })
}

const tabs = computed(() => [
  { name: 'All Candidators', key: 'all', count: dashboardStore.stats.totalCandidators },
  { name: 'Fetched Resumes', key: 'fetched', count: dashboardStore.stats.fetchedResumes },
  { name: 'Extracted Contacts', key: 'extracted', count: dashboardStore.stats.extractedContacts },
  { name: 'SMS Transferred', key: 'transferred', count: dashboardStore.stats.transferredSMS }
])

const setActiveTab = (tab: string) => {
  activeTab.value = tab
  page.value = 1;
  updateQuery({ status: tab, page: 1 })
}

const getSMSStatusClass = (status: string) => {
  switch (status) {
    case 'sent':
      return 'bg-blue-100 text-blue-800'
    case 'delivered':
      return 'bg-green-100 text-green-800'
    case 'undelivered':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const tryAgain = async (candidator: any) => {
  try {
    const id = candidator.gmail_id || candidator.id;
    await api.put(`/api/candidators/tryagain/${id}`).then(() => {
      fetchPaginated();
    }).catch((err) => {
      console.error('Retry failed:', err);
    });
    fetchPaginated();
  } catch (err) {
    console.error('Retry failed:', err);
  }
};

// Watch for route query changes
watch(() => route.query.filter, (filter) => {
  if (filter && typeof filter === 'string') {
    activeTab.value = filter
    setActiveTab(filter)
  }
}, { immediate: true })

const showMessageModal = ref(false)
const selectedMessage = ref<any>(null)
function openMessageModal(row: any) {
  selectedMessage.value = row
  showMessageModal.value = true
}
function closeMessageModal() {
  showMessageModal.value = false
  selectedMessage.value = null
}

const newSmsText = ref('')
const sendingSms = ref(false)

async function sendSms() {
  if (!selectedMessage.value || !newSmsText.value.trim()) return;
  sendingSms.value = true;
  try {
    // Adjust the API endpoint and payload as needed
    const { data } = await api.post('/api/sms/send', {
      phone_number: selectedMessage.value.phone_number,
      message: newSmsText.value
    });
    // On success, push the new message to chat history
    if (selectedMessage.value.aggregated_messages && Array.isArray(selectedMessage.value.aggregated_messages)) {
      selectedMessage.value.aggregated_messages.push({
        message: null,
        created_at: new Date().toISOString(),
        reply: newSmsText.value
      });
    }
    newSmsText.value = '';
  } catch (err) {
    alert('Failed to send SMS');
  } finally {
    sendingSms.value = false;
  }
}

onMounted(async () => {
  // await dashboardStore.fetchStats()
  useDashboardWebSocket((msg) => {
    for (const [key, value] of Object.entries(msg)) {
      if (key === 'whole') {
      } else {
        const {count} = value as {count: number}
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
  })
  // Check if there's a filter in the route query
  const filter = route.query.filter
  if (filter && typeof filter === 'string') {
    activeTab.value = filter
    setActiveTab(filter)
  } else {
    // candidatorsStore.fetchCandidators()
  }
  // If no sortField/sortOrder in query, set default to gmail_timestamp desc
  if (!route.query.sortField || !route.query.sortOrder) {
    updateQuery({ sortField: 'gmail_timestamp', sortOrder: 'dsc' })
  }
})
</script>

<style scoped>
.sticky-col {
  position: sticky;
  left: 0;
}
.sticky-col-left {
  left: 0;
  box-shadow: 2px 0 5px -2px rgba(0,0,0,0.05);
}
@media (max-width: 640px) {
  .min-w-max {
    min-width: 500px;
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.chat-history {
  max-height: 350px;
  overflow-y: auto;
  padding: 8px 0;
}
.chat-bubble {
  display: inline-block;
  padding: 10px 14px;
  border-radius: 18px;
  max-width: 80%;
  word-break: break-word;
  font-size: 15px;
  margin-bottom: 2px;
}
.chat-bubble-right {
  background: #3b82f6;
  color: #fff;
  border-bottom-right-radius: 4px;
  border-top-right-radius: 18px;
  border-top-left-radius: 18px;
  border-bottom-left-radius: 18px;
  align-self: flex-end;
}
.chat-bubble-left {
  background: #e5e7eb;
  color: #222;
  border-bottom-left-radius: 4px;
  border-top-right-radius: 18px;
  border-top-left-radius: 18px;
  border-bottom-right-radius: 18px;
  align-self: flex-start;
}
.chat-time {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
  text-align: right;
}
.text-white {
  color: #fff;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>