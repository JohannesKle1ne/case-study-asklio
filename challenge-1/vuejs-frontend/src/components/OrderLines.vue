<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
      <h2 class="text-base font-semibold text-gray-700">Order Lines</h2>
      <button
        type="button"
        @click="$emit('add-line')"
        class="cursor-pointer inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <PlusCircle class="w-4 h-4" /> Add Line
      </button>
    </div>

    <p v-if="orderLinesError" class="text-red-500 text-xs mb-3">
      {{ orderLinesError }}
    </p>

    <div
      v-for="(field, index) in orderLines"
      :key="field.key"
      class="mb-4 pb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0"
    >
      <p
        v-if="
          submitAttempted &&
          (errors[`order_lines[${index}].position_description`] ||
            errors[`order_lines[${index}].unit_price`] ||
            errors[`order_lines[${index}].amount`] ||
            errors[`order_lines[${index}].unit`] ||
            errors[`order_lines[${index}].total_price`])
        "
        class="text-red-500 text-xs mb-1"
      >
        Line {{ index + 1 }}: Please fill in all required fields with valid values.
      </p>
      <div class="flex items-start gap-2">
        <span class="mt-2 text-xs font-semibold text-gray-400 w-5 text-center">{{
          index + 1
        }}</span>
        <div class="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div class="col-span-2 sm:col-span-2">
            <label class="block text-xs text-gray-500 mb-1">Description</label>
            <input
              :value="
                (values.order_lines?.[index] as { position_description: string })
                  ?.position_description
              "
              @input="
                (e) =>
                  $emit('update-line-field', index, {
                    position_description: (e.target as HTMLInputElement).value,
                  })
              "
              type="text"
              placeholder="Item description"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Unit Price</label>
            <input
              :value="(values.order_lines?.[index] as { unit_price: number })?.unit_price || ''"
              @input="
                (e) => {
                  const newUnitPrice = Number((e.target as HTMLInputElement).value);
                  const amount = Number(
                    (values.order_lines?.[index] as { amount: number })?.amount || 0,
                  );
                  $emit('update-line-field', index, {
                    unit_price: newUnitPrice,
                    total_price: newUnitPrice * amount,
                  });
                }
              "
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Amount</label>
            <input
              :value="(values.order_lines?.[index] as { amount: number })?.amount || ''"
              @input="
                (e) => {
                  const newAmount = Number((e.target as HTMLInputElement).value);
                  const unitPrice = Number(
                    (values.order_lines?.[index] as { unit_price: number })?.unit_price || 0,
                  );
                  $emit('update-line-field', index, {
                    amount: newAmount,
                    total_price: unitPrice * newAmount,
                  });
                }
              "
              type="number"
              min="0"
              step="any"
              placeholder="0"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Unit</label>
            <input
              :value="(values.order_lines?.[index] as { unit: string })?.unit"
              @input="
                (e) =>
                  $emit('update-line-field', index, { unit: (e.target as HTMLInputElement).value })
              "
              type="text"
              placeholder="licenses"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div class="mt-2 flex flex-col items-end gap-1">
          <span class="text-xs text-gray-500">Total</span>
          <span class="text-sm font-medium text-gray-700">
            €{{
              ((values.order_lines?.[index] as { total_price: number })?.total_price || 0).toFixed(
                2,
              )
            }}
          </span>
        </div>
        <button
          v-if="orderLines.length > 1"
          type="button"
          @click="$emit('remove-line', index)"
          class="cursor-pointer mt-2 text-gray-300 hover:text-red-400 transition-colors"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="mt-4 pt-3 space-y-1">
      <div class="flex justify-between text-sm text-gray-500">
        <span>Subtotal (net)</span>
        <span>€{{ (extractedSubtotalNet ?? totalCost).toFixed(2) }}</span>
      </div>
      <div
        v-for="surcharge in extractedSurcharges"
        :key="surcharge.label"
        class="flex justify-between text-sm text-gray-500"
      >
        <span>{{ surcharge.label }}</span>
        <span>€{{ surcharge.amount.toFixed(2) }}</span>
      </div>
      <div
        class="flex justify-between text-sm font-semibold text-gray-700 pt-1 border-t border-gray-100"
      >
        <span>Total Cost</span>
        <span class="text-indigo-600">€{{ (extractedTotalCost ?? totalCost).toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusCircle, Trash2 } from "lucide-vue-next";
import type { FieldEntry } from "vee-validate";
import type { Surcharge } from "@/types/procurement";

type OrderLineField = {
  position_description: string;
  unit_price: number;
  amount: number;
  unit: string;
  total_price: number;
};

defineProps<{
  orderLines: FieldEntry<unknown>[];
  values: {
    order_lines?: Partial<OrderLineField>[];
  };
  orderLinesError: string | undefined;
  submitAttempted: boolean;
  errors: Record<string, string | undefined>;
  totalCost: number;
  extractedSubtotalNet: number | null;
  extractedTotalCost: number | null;
  extractedSurcharges: Surcharge[];
}>();

defineEmits<{
  "add-line": [];
  "remove-line": [index: number];
  "update-line-field": [index: number, patch: Partial<OrderLineField>];
}>();
</script>
