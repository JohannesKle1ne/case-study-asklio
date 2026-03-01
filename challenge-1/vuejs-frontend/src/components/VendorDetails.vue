<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
    <div class="flex items-center justify-between border-b border-gray-100 pb-3">
      <h2 class="text-base font-semibold text-gray-700">Vendor Details</h2>
      <div class="flex items-center gap-3">
        <span v-if="isExtracting" class="flex items-center gap-2 text-sm text-indigo-600">
          <Loader2 class="w-4 h-4 animate-spin" /> Extracting...
        </span>
        <span v-if="extractError" class="text-sm text-red-500">{{ extractError }}</span>
        <label
          class="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
        >
          <Upload class="w-3.5 h-3.5" />
          Upload Offer PDF
          <input
            ref="fileInput"
            type="file"
            accept="application/pdf"
            class="hidden"
            @change="$emit('file-upload', $event)"
          />
        </label>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Vendor Name <span class="text-red-500">*</span></label
        >
        <input
          v-model="vendorName"
          v-bind="vendorNameAttrs"
          type="text"
          placeholder="e.g. Adobe Systems"
          class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          :class="showError('vendor_name') ? 'border-red-400' : 'border-gray-300'"
          @blur="$emit('field-blur', 'vendor_name')"
        />
        <p v-if="showError('vendor_name')" class="text-red-500 text-xs mt-1">
          {{ errors.vendor_name }}
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >VAT ID <span class="text-red-500">*</span></label
        >
        <input
          v-model="vatId"
          v-bind="vatIdAttrs"
          type="text"
          placeholder="e.g. DE123456789"
          class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          :class="showError('vat_id') ? 'border-red-400' : 'border-gray-300'"
          @blur="$emit('field-blur', 'vat_id')"
        />
        <p v-if="showError('vat_id')" class="text-red-500 text-xs mt-1">{{ errors.vat_id }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2, Upload } from "lucide-vue-next";

type FieldName = "requestor_name" | "title" | "vendor_name" | "vat_id" | "department";

defineProps<{
  vendorNameAttrs: Record<string, unknown>;
  vatIdAttrs: Record<string, unknown>;
  errors: Partial<Record<FieldName, string>>;
  showError: (field: FieldName) => boolean;
  isExtracting: boolean;
  extractError: string | null;
}>();

defineEmits<{
  "field-blur": [field: FieldName];
  "file-upload": [event: Event];
}>();

const vendorName = defineModel<string>("vendorName", { required: true });
const vatId = defineModel<string>("vatId", { required: true });
</script>
