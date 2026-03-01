<template>
  <!-- Main row -->
  <tr
    class="hover:bg-gray-50 cursor-pointer transition-colors"
    @click="$emit('toggle', request.id)"
  >
    <td class="px-4 py-3">
      <p class="font-medium text-gray-800">{{ request.title }}</p>
      <p class="text-xs text-gray-400">#{{ request.id }} · {{ request.requestor_name }}</p>
    </td>
    <td class="px-4 py-3 text-gray-600">
      <p>{{ request.vendor_name }}</p>
      <p class="text-xs text-gray-400">{{ request.vat_id }}</p>
    </td>
    <td class="px-4 py-3 text-gray-600">{{ request.department }}</td>
    <td class="px-4 py-3 text-right font-medium text-gray-800">
      €{{ Number(request.total_cost).toFixed(2) }}
    </td>
    <td class="px-4 py-3" @click.stop>
      <div v-if="updatingStatus === request.id" class="flex items-center gap-2">
        <Loader2 class="w-3.5 h-3.5 animate-spin text-gray-400" />
        <span class="text-xs text-gray-400">Updating...</span>
      </div>
      <div v-else class="relative inline-flex items-center">
        <select
          :value="request.status"
          @change="$emit('status-change', request, ($event.target as HTMLSelectElement).value)"
          class="cursor-pointer appearance-none text-xs font-semibold rounded-full pl-3 pr-6 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          :class="statusColor(request.status)"
        >
          <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-2 w-3 h-3"
          :class="statusColor(request.status)"
        />
      </div>
    </td>
    <td class="px-4 py-3 text-xs text-gray-400">{{ formatDate(request.created_at) }}</td>
    <td class="px-4 py-3 text-gray-400">
      <ChevronUp v-if="isExpanded" class="w-4 h-4" />
      <ChevronDown v-else class="w-4 h-4" />
    </td>
  </tr>

  <!-- Expanded detail row -->
  <tr v-if="isExpanded" class="bg-gray-50">
    <td colspan="7" class="px-6 py-4">
      <div
        v-if="loadingDetail === request.id"
        class="flex items-center gap-2 text-sm text-gray-400 py-2"
      >
        <Loader2 class="w-4 h-4 animate-spin" /> Loading details...
      </div>
      <div v-else-if="detail" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Order Lines -->
        <div>
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Order Lines
          </h3>
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left text-gray-500 font-medium">Description</th>
                  <th class="px-3 py-2 text-right text-gray-500 font-medium">Unit Price</th>
                  <th class="px-3 py-2 text-right text-gray-500 font-medium">Qty</th>
                  <th class="px-3 py-2 text-left text-gray-500 font-medium">Unit</th>
                  <th class="px-3 py-2 text-right text-gray-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="line in detail.order_lines" :key="line.id">
                  <td class="px-3 py-2 text-gray-700">{{ line.position_description }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">
                    €{{ Number(line.unit_price).toFixed(2) }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ line.amount }}</td>
                  <td class="px-3 py-2 text-gray-600">{{ line.unit }}</td>
                  <td class="px-3 py-2 text-right font-medium text-gray-700">
                    €{{ Number(line.total_price).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <span class="text-xs text-gray-500">Commodity Group:</span>
            <span class="text-xs font-medium text-gray-700">{{
              request.commodity_group_name
            }}</span>
            <span class="text-xs text-gray-400">({{ request.commodity_group_id }})</span>
          </div>
        </div>

        <!-- Status History -->
        <div>
          <h3
            class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1"
          >
            <Clock class="w-3.5 h-3.5" /> Status History
          </h3>
          <div class="space-y-2">
            <div
              v-for="(entry, idx) in detail.status_history"
              :key="entry.id"
              class="flex items-start gap-3"
            >
              <div class="flex flex-col items-center">
                <div
                  class="w-2.5 h-2.5 rounded-full mt-0.5 border-2"
                  :class="
                    idx === historyLength - 1
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'bg-white border-gray-300'
                  "
                ></div>
                <div
                  v-if="idx < historyLength - 1"
                  class="w-px flex-1 bg-gray-200 mt-1 min-h-4"
                ></div>
              </div>
              <div class="pb-3">
                <p class="text-xs font-medium text-gray-700">{{ historyLabel(entry) }}</p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ formatDate(entry.changed_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronDown, ChevronUp, Clock, Loader2 } from "lucide-vue-next";
import type { ProcurementRequest } from "@/types/procurement";
import { statusColor, formatDate, historyLabel } from "@/utils/requestFormatters";

const STATUS_OPTIONS = ["Open", "In Progress", "Closed"] as const;

const props = defineProps<{
  request: ProcurementRequest;
  isExpanded: boolean;
  loadingDetail: number | null;
  updatingStatus: number | null;
  detail: ProcurementRequest | null;
}>();

defineEmits<{
  toggle: [id: number];
  "status-change": [request: ProcurementRequest, newStatus: string];
}>();

const historyLength = computed(() => props.detail?.status_history?.length ?? 0);
</script>
