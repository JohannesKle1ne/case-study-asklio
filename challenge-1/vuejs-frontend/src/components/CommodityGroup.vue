<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <div class="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
      <h2 class="text-base font-semibold text-gray-700">Commodity Group</h2>
    </div>

    <div v-if="isSuggesting" class="flex items-center gap-2 text-sm text-indigo-600">
      <Loader2 class="w-4 h-4 animate-spin" /> Analyzing items...
    </div>

    <div
      v-else-if="commodityResult && !isEditingCommodity"
      class="flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <CheckCircle class="w-5 h-5 text-green-500" />
        <div>
          <p class="text-sm font-medium text-gray-800">
            {{ commodityResult.commodity_group_name }}
          </p>
          <p class="text-xs text-gray-400">
            {{ commodityResult.category }} · ID: {{ commodityResult.commodity_group_id }}
          </p>
        </div>
      </div>
      <button
        type="button"
        @click="isEditingCommodity = true"
        class="cursor-pointer inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
      >
        <Pencil class="w-3 h-3" /> Change
      </button>
    </div>

    <div v-else-if="isEditingCommodity && commodityResult" class="space-y-2">
      <p class="text-xs text-gray-500">Override the suggested commodity group:</p>
      <select
        :value="commodityResult.commodity_group_id"
        @change="
          (e) => {
            const selected = commodityGroups.find(
              (g) => g.id === (e.target as HTMLSelectElement).value,
            );
            if (selected && commodityResult) {
              commodityResult.commodity_group_id = selected.id;
              commodityResult.commodity_group_name = selected.name;
              commodityResult.category = selected.category;
            }
          }
        "
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <optgroup
          v-for="category in [...new Set(commodityGroups.map((g) => g.category))]"
          :key="category"
          :label="category"
        >
          <option
            v-for="group in commodityGroups.filter((g) => g.category === category)"
            :key="group.id"
            :value="group.id"
          >
            {{ group.name }}
          </option>
        </optgroup>
      </select>
      <button
        type="button"
        @click="isEditingCommodity = false"
        class="cursor-pointer text-xs text-indigo-600 hover:text-indigo-800 font-medium"
      >
        Done
      </button>
    </div>

    <div v-else-if="suggestError" class="text-sm text-red-500">{{ suggestError }}</div>

    <div v-else class="text-sm text-gray-400 italic">
      Add item descriptions above — a commodity group will be suggested automatically.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Loader2, CheckCircle, Pencil } from "lucide-vue-next";
import type { CommodityGroup as CommodityGroupType } from "@/services/api";
import type { CommoditySuggestion } from "@/types/procurement";

const props = defineProps<{
  commodityResult: CommoditySuggestion | null;
  commodityGroups: CommodityGroupType[];
  isSuggesting: boolean;
  suggestError: string | null;
}>();

const isEditingCommodity = ref(false);
</script>
