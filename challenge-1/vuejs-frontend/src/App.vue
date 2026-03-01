<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, RouterView } from "vue-router";

const viewKey = ref(0);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-indigo-600">askLio</span>
            <span class="text-gray-300">|</span>
            <span class="text-sm text-gray-500 font-medium">Procurement</span>
          </div>
          <div class="flex gap-1">
            <RouterLink
              to="/"
              class="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              active-class="bg-indigo-50 text-indigo-700 hover:bg-indigo-50"
            >
              New Request
            </RouterLink>
            <RouterLink
              to="/requests"
              class="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              active-class="bg-indigo-50 text-indigo-700 hover:bg-indigo-50"
            >
              Request Overview
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RouterView :key="viewKey" @new-request="viewKey++" />
    </main>
  </div>
</template>
