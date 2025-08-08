<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-900">Candidates Dashboard</h1>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/dashboard"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2"
                :class="$route.path === '/' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                Dashboard
              </router-link>
              <router-link
                to="/candidators"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2"
                :class="$route.path === '/candidators' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                Candidates
              </router-link>
              <router-link
                to="/settings"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2"
                :class="$route.path === '/settings' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                Settings
              </router-link>
            </div>
          </div>
          <!-- Mobile menu button -->
          <div class="flex items-center sm:hidden">
            <button class="p-2 rounded focus:outline-none" @click="showMenu = true">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
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
          <router-link to="/candidators" @click.native="showMenu = false">Candidates</router-link>
          <router-link to="/settings" @click.native="showMenu = false">Settings</router-link>
        </nav>
      </div>
    </transition>
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const showMenu = ref(false)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>