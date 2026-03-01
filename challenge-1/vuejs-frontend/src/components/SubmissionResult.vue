<template>
  <div class="max-w-3xl mx-auto">
    <div
      v-if="success"
      class="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center text-center gap-4"
    >
      <CheckCircle class="w-12 h-12 text-green-500" />
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Request submitted successfully!</h2>
        <p class="text-sm text-gray-500 mt-1">Your procurement request has been created.</p>
      </div>
      <button
        type="button"
        @click="$emit('new-request')"
        class="cursor-pointer mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Make another request
      </button>
    </div>

    <div
      v-else
      class="bg-white rounded-xl border border-red-200 p-10 flex flex-col items-center text-center gap-4"
    >
      <XCircle class="w-12 h-12 text-red-400" />
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Submission failed</h2>
        <p class="text-sm text-red-500 mt-1">{{ error }}</p>
      </div>
      <button
        type="button"
        @click="$emit('retry')"
        class="cursor-pointer mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, XCircle } from "lucide-vue-next";

defineProps<{
  success: boolean;
  error?: string;
}>();

defineEmits<{
  "new-request": [];
  retry: [];
}>();
</script>
