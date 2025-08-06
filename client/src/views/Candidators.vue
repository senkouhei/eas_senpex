<template>
  <div class="px-4 py-6 sm:px-0">
    <div class="sm:flex sm:items-center mb-6">
      <div class="sm:flex-auto">
        <h1 class="text-3xl font-bold text-gray-900">Candidators</h1>
        <p class="mt-2 text-sm text-gray-700">A list of all candidators with their current status.</p>
      </div>
    </div>

    <v-text-field
      v-model="search"
      label="Search by name..."
      class="mb-4"
      @input="onSearch"
      clearable
    />

    <v-data-table
      :headers="headers"
      :items="tableItems"
      :items-per-page="limit"
      :page.sync="page"
      :server-items-length="totalCount"
      :loading="candidatorsStore.loading"
      :search="search"
      class="elevation-1"
      @update:page="onPageChange"
      @update:items-per-page="onLimitChange"
    >
      <template #item.url="{ item }">
        <a :href="item.url" target="_blank" class="text-blue-600 hover:text-blue-900">View Profile</a>
      </template>
      <template #item.sms_status="{ item }">
        <span :class="getSMSStatusClass(item.sms_status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
          {{ item.sms_status }}
        </span>
      </template>
      <template #item.progress="{ item }">
        <div class="flex space-x-1">
          <span :class="item.resume_fetched ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">Resume</span>
          <span :class="item.contact_extracted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">Contact</span>
          <span :class="item.sms_transferred ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">SMS</span>
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCandidatorsStore } from '../stores/candidators'

const candidatorsStore = useCandidatorsStore()
const page = ref(1)
const limit = ref(20)
const totalCount = computed(() => candidatorsStore.totalCount)
const search = ref('')

const headers = [
  { text: 'Name', value: 'name' },
  { text: 'Email', value: 'email' },
  { text: 'Phone Number', value: 'phone_number' },
  { text: 'Location', value: 'location', sortable: false },
  { text: 'URL', value: 'url', sortable: false },
  { text: 'SMS Status', value: 'sms_status', sortable: false },
  { text: 'Progress', value: 'progress', sortable: false },
]

// Map candidators to add a 'location' field for the table
const tableItems = computed(() => {
  console.log(candidatorsStore.candidators)
  return candidatorsStore.candidators.map(item => ({
    ...item,
    location: `${item.city || ''}${item.city && item.state ? ', ' : ''}${item.state || ''}`
  }))
})

const getSMSStatusClass = (status: string) => {
  switch (status) {
    case 'sent':
      return 'bg-blue-100 text-blue-800'
    case 'delivered':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const fetchPaginated = () => {
  candidatorsStore.fetchPaginated({ page: page.value, limit: limit.value, search: search.value })
}

const onSearch = () => {
  page.value = 1
  fetchPaginated()
}
const onPageChange = (newPage: number) => {
  page.value = newPage
  fetchPaginated()
}
const onLimitChange = (newLimit: number) => {
  limit.value = newLimit
  page.value = 1
  fetchPaginated()
}

watch([page, limit, search], fetchPaginated, { immediate: true })

onMounted(() => {
  fetchPaginated()
})
</script>