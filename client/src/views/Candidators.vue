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
</style>