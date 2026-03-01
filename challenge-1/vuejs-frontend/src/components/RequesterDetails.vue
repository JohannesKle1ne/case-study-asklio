<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
    <div class="flex items-center justify-between border-b border-gray-100 pb-3">
      <h2 class="text-base font-semibold text-gray-700">Requestor Details</h2>
      <button
        type="button"
        @click="$emit('fill-dev-data')"
        class="opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity text-[10px] text-gray-300 hover:text-gray-400 px-1.5 py-0.5 rounded border border-transparent hover:border-gray-200 select-none"
        tabindex="-1"
      >
        dev
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Requestor Name <span class="text-red-500">*</span></label
        >
        <input
          v-model="requestorName"
          v-bind="requestorNameAttrs"
          type="text"
          placeholder="John Doe"
          class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          :class="showError('requestor_name') ? 'border-red-400' : 'border-gray-300'"
          @blur="$emit('field-blur', 'requestor_name')"
        />
        <p v-if="showError('requestor_name')" class="text-red-500 text-xs mt-1">
          {{ errors.requestor_name }}
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Department <span class="text-red-500">*</span></label
        >
        <input
          v-model="department"
          v-bind="departmentAttrs"
          type="text"
          placeholder="e.g. Marketing"
          class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          :class="showError('department') ? 'border-red-400' : 'border-gray-300'"
          @blur="$emit('field-blur', 'department')"
        />
        <p v-if="showError('department')" class="text-red-500 text-xs mt-1">
          {{ errors.department }}
        </p>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"
        >Title / Short Description <span class="text-red-500">*</span></label
      >
      <input
        v-model="title"
        v-bind="titleAttrs"
        type="text"
        placeholder="e.g. Adobe Creative Cloud Subscription"
        class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        :class="showError('title') ? 'border-red-400' : 'border-gray-300'"
        @blur="$emit('field-blur', 'title')"
      />
      <p v-if="showError('title')" class="text-red-500 text-xs mt-1">{{ errors.title }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
type FieldName = "requestor_name" | "title" | "vendor_name" | "vat_id" | "department";

defineProps<{
  requestorNameAttrs: Record<string, unknown>;
  titleAttrs: Record<string, unknown>;
  departmentAttrs: Record<string, unknown>;
  errors: Partial<Record<FieldName, string>>;
  showError: (field: FieldName) => boolean;
}>();

defineEmits<{
  "fill-dev-data": [];
  "field-blur": [field: FieldName];
}>();

const requestorName = defineModel<string>("requestorName", { required: true });
const title = defineModel<string>("title", { required: true });
const department = defineModel<string>("department", { required: true });
</script>
