<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { RefreshCw, Loader2 } from "lucide-vue-next";
import { fetchRequest, fetchRequests, updateRequestStatus } from "@/services/api";
import type { ProcurementRequest } from "@/types/procurement";
import RequestTableRow from "@/components/RequestTableRow.vue";

const requests = ref<ProcurementRequest[]>([]);
const isLoading = ref(true);
const loadError = ref<string | null>(null);

const statusFilter = ref<string>("All");
const expandedId = ref<number | null>(null);
const detailCache = ref<Record<number, ProcurementRequest>>({});
const loadingDetail = ref<number | null>(null);
const updatingStatus = ref<number | null>(null);

const STATUS_OPTIONS = ["Open", "In Progress", "Closed"] as const;

const filteredRequests = computed(() => {
  if (statusFilter.value === "All") return requests.value;
  return requests.value.filter((r) => r.status === statusFilter.value);
});

async function loadRequests() {
  isLoading.value = true;
  loadError.value = null;
  try {
    requests.value = await fetchRequests();
  } catch (err: unknown) {
    loadError.value = err instanceof Error ? err.message : "Failed to load requests";
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadRequests);

async function toggleExpand(id: number) {
  if (expandedId.value === id) {
    expandedId.value = null;
    return;
  }
  expandedId.value = id;
  if (!detailCache.value[id]) {
    loadingDetail.value = id;
    try {
      detailCache.value[id] = await fetchRequest(id);
    } finally {
      loadingDetail.value = null;
    }
  }
}

async function handleStatusChange(request: ProcurementRequest, newStatus: string) {
  if (newStatus === request.status) return;
  updatingStatus.value = request.id;
  try {
    const updated = await updateRequestStatus(
      request.id,
      newStatus as "Open" | "In Progress" | "Closed",
    );
    const idx = requests.value.findIndex((r) => r.id === request.id);
    if (idx !== -1)
      requests.value[idx] = {
        ...requests.value[idx],
        status: updated.status,
      } as ProcurementRequest;
    // Invalidate detail cache so history refreshes
    delete detailCache.value[request.id];
    if (expandedId.value === request.id) {
      loadingDetail.value = request.id;
      try {
        detailCache.value[request.id] = await fetchRequest(request.id);
      } finally {
        loadingDetail.value = null;
      }
    }
  } catch (err: unknown) {
    console.error("Status update failed:", err);
  } finally {
    updatingStatus.value = null;
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Request Overview</h1>
        <p class="text-gray-500 mt-1 text-sm">Manage and track all procurement requests.</p>
      </div>
      <button
        @click="loadRequests"
        class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <RefreshCw class="w-4 h-4" :class="isLoading ? 'animate-spin' : ''" /> Refresh
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="opt in ['All', ...STATUS_OPTIONS]"
        :key="opt"
        @click="statusFilter = opt"
        class="cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        :class="
          statusFilter === opt
            ? 'bg-indigo-600 text-white'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
        "
      >
        {{ opt }}
        <span v-if="opt === 'All'" class="ml-1 text-xs opacity-70">({{ requests.length }})</span>
        <span v-else class="ml-1 text-xs opacity-70">
          ({{ requests.filter((r) => r.status === opt).length }})
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-16">
      <Loader2 class="w-8 h-8 animate-spin text-indigo-400" />
    </div>

    <!-- Error -->
    <div
      v-else-if="loadError"
      class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"
    >
      {{ loadError }}
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredRequests.length === 0" class="text-center py-16 text-gray-400">
      <p class="text-lg font-medium">No requests found</p>
      <p class="text-sm mt-1">
        {{
          statusFilter !== "All"
            ? "Try a different filter."
            : "Submit your first procurement request."
        }}
      </p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              Request
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              Vendor
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              Department
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              Total
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              Status
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              Created
            </th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <RequestTableRow
            v-for="request in filteredRequests"
            :key="request.id"
            :request="request"
            :is-expanded="expandedId === request.id"
            :loading-detail="loadingDetail"
            :updating-status="updatingStatus"
            :detail="detailCache[request.id] ?? null"
            @toggle="toggleExpand"
            @status-change="handleStatusChange"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>
