<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import type { ExtractedData, Surcharge, CommoditySuggestion } from "@/types/procurement";
import { useForm, useFieldArray } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { Loader2 } from "lucide-vue-next";
import {
  createRequest,
  extractFromPdf,
  suggestCommodity,
  fetchCommodityGroups,
} from "@/services/api";
import type { CommodityGroup as CommodityGroupType } from "@/services/api";
import RequesterDetails from "@/components/RequesterDetails.vue";
import VendorDetails from "@/components/VendorDetails.vue";
import OrderLines from "@/components/OrderLines.vue";
import SubmissionResult from "@/components/SubmissionResult.vue";
import CommodityGroup from "@/components/CommodityGroup.vue";

const router = useRouter();

const emit = defineEmits<{ "new-request": [] }>();

const orderLineSchema = z.object({
  position_description: z.string().min(1, "Description is required"),
  unit_price: z.coerce.number().positive("Must be positive"),
  amount: z.coerce.number().positive("Must be positive"),
  unit: z.string().min(1, "Unit is required"),
  total_price: z.coerce.number().positive("Must be positive"),
});

const formSchema = toTypedSchema(
  z.object({
    requestor_name: z.string().min(1, "Requestor name is required"),
    title: z.string().min(1, "Title is required"),
    vendor_name: z.string().min(1, "Vendor name is required"),
    vat_id: z
      .string()
      .min(1, "VAT ID is required")
      .regex(/^[A-Z]{2}[0-9A-Z]{2,12}$/, "Invalid VAT ID format (e.g. DE123456789)"),
    department: z.string().min(1, "Department is required"),
    order_lines: z.array(orderLineSchema).min(1, "At least one order line is required"),
  }),
);

const { handleSubmit, errors, defineField, setValues, values, validateField } = useForm<{
  requestor_name: string;
  title: string;
  vendor_name: string;
  vat_id: string;
  department: string;
  order_lines: {
    position_description: string;
    unit_price: number;
    amount: number;
    unit: string;
    total_price: number;
  }[];
}>({
  validationSchema: formSchema,
  initialValues: {
    requestor_name: "",
    title: "",
    vendor_name: "",
    vat_id: "",
    department: "",
    order_lines: [{ position_description: "", unit_price: 0, amount: 0, unit: "", total_price: 0 }],
  },
});

const noAutoValidate = {
  validateOnBlur: false,
  validateOnChange: false,
  validateOnInput: false,
  validateOnModelUpdate: false,
};
const [requestorName, requestorNameAttrs] = defineField("requestor_name", noAutoValidate);
const [title, titleAttrs] = defineField("title", noAutoValidate);
const [vendorName, vendorNameAttrs] = defineField("vendor_name", noAutoValidate);
const [vatId, vatIdAttrs] = defineField("vat_id", noAutoValidate);
const [department, departmentAttrs] = defineField("department", noAutoValidate);

type FieldName = "requestor_name" | "title" | "vendor_name" | "vat_id" | "department";
const blurredFields = ref<Set<FieldName>>(new Set());

async function onFieldBlur(field: FieldName) {
  blurredFields.value = new Set(blurredFields.value).add(field);
  await validateField(field);
}

function showError(field: FieldName): boolean {
  const errs = errors.value as unknown as Record<FieldName, string | undefined>;
  return (blurredFields.value.has(field) || submitAttempted.value) && !!errs[field];
}

const { fields: orderLines, push: addLine, remove: removeLine } = useFieldArray("order_lines");

const totalCost = computed(() => {
  if (!values.order_lines) return 0;
  return values.order_lines.reduce((sum, line) => sum + (Number(line.total_price) || 0), 0);
});

type OrderLineField = {
  position_description: string;
  unit_price: number;
  amount: number;
  unit: string;
  total_price: number;
};

function updateLineField(index: number, patch: Partial<OrderLineField>) {
  const lines = [...(values.order_lines || [])] as OrderLineField[];
  lines[index] = { ...lines[index], ...patch } as OrderLineField;
  setValues({ order_lines: lines });
  extractedTotalCost.value = null;
  extractedSubtotalNet.value = null;
  extractedSurcharges.value = [];
}

function addOrderLine() {
  addLine({ position_description: "", unit_price: 0, amount: 0, unit: "", total_price: 0 });
}

function fillDevRequestorData() {
  setValues({
    requestor_name: "John Doe",
    department: "Marketing",
    title: "This is a test description",
  });
}

const isSubmitting = ref(false);
const submitError = ref<string | null>(null);
const submitDone = ref(false);
const submitAttempted = ref(false);

const onSubmit = handleSubmit(
  async (formValues) => {
    submitAttempted.value = true;
    isSubmitting.value = true;
    submitError.value = null;
    try {
      const payload = {
        ...formValues,
        commodity_group_id: commodityResult.value?.commodity_group_id ?? "",
        commodity_group_name: commodityResult.value?.commodity_group_name ?? "",
        total_cost: extractedTotalCost.value ?? totalCost.value,
        order_lines: formValues.order_lines,
      };

      if (!payload.commodity_group_id) {
        submitError.value =
          "Commodity group could not be determined. Please add item descriptions and try again.";
        submitDone.value = true;
        return;
      }

      await createRequest(payload);
      submitError.value = null;
      submitDone.value = true;
    } catch (err: unknown) {
      submitError.value = err instanceof Error ? err.message : "Failed to submit request";
      submitDone.value = true;
    } finally {
      isSubmitting.value = false;
    }
  },
  () => {
    submitAttempted.value = true;
  },
);

// PDF Upload & Extraction
const isExtracting = ref(false);
const extractError = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const extractedSurcharges = ref<Surcharge[]>([]);
const extractedTotalCost = ref<number | null>(null);
const extractedSubtotalNet = ref<number | null>(null);
const isPdfExtracting = ref(false);

async function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  isExtracting.value = true;
  isPdfExtracting.value = true;
  extractError.value = null;

  try {
    const extracted = await extractFromPdf(file);

    const patch: Record<string, unknown> = {};
    if (extracted.vendor_name) patch.vendor_name = extracted.vendor_name;
    if (extracted.vat_id) patch.vat_id = extracted.vat_id;
    if (extracted.requestor_department) patch.department = extracted.requestor_department;

    extractedSurcharges.value = extracted.surcharges ?? [];
    extractedTotalCost.value = extracted.total_cost ?? null;
    extractedSubtotalNet.value = extracted.subtotal_net ?? null;

    if (extracted.order_lines?.length) {
      patch.order_lines = extracted.order_lines.map((l) => ({
        position_description: l.position_description ?? "",
        unit_price: Number(l.unit_price) || 0,
        amount: Number(l.amount) || 0,
        unit: l.unit ?? "",
        total_price: Number(l.total_price) || 0,
      }));
    }

    setValues(patch as Parameters<typeof setValues>[0]);

    if (extracted.commodity_suggestion) {
      commodityResult.value = extracted.commodity_suggestion;
    }
  } catch (err: unknown) {
    extractError.value = err instanceof Error ? err.message : "Extraction failed";
  } finally {
    isExtracting.value = false;
    if (fileInput.value) fileInput.value.value = "";
    await nextTick();
    isPdfExtracting.value = false;
  }
}

// Commodity Group Suggestion
const commodityResult = ref<CommoditySuggestion | null>(null);
const isSuggesting = ref(false);
const suggestError = ref<string | null>(null);
const commodityGroups = ref<CommodityGroupType[]>([]);

fetchCommodityGroups().then((groups) => {
  commodityGroups.value = groups as CommodityGroupType[];
});

let suggestionTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  () => values.order_lines?.map((l) => l.position_description).join("|"),
  (newVal) => {
    if (isPdfExtracting.value) return;
    if (!newVal || newVal.replace(/\|/g, "").trim().length < 1) return;
    if (suggestionTimeout) clearTimeout(suggestionTimeout);
    suggestionTimeout = setTimeout(() => {
      const descriptions = (values.order_lines || [])
        .map((l) => l.position_description)
        .filter((d) => d && d.trim().length > 0);
      if (descriptions.length > 0) {
        triggerCommoditySuggestion(descriptions);
      }
    }, 1000);
  },
);

async function triggerCommoditySuggestion(descriptions: string[]) {
  isSuggesting.value = true;
  suggestError.value = null;
  try {
    commodityResult.value = await suggestCommodity(descriptions);
  } catch {
    suggestError.value = "Could not suggest commodity group";
  } finally {
    isSuggesting.value = false;
  }
}
</script>

<template>
  <SubmissionResult
    v-if="submitDone"
    :success="!submitError"
    :error="submitError ?? undefined"
    @new-request="emit('new-request')"
    @retry="
      submitDone = false;
      submitError = null;
    "
  />
  <div v-else>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">New Procurement Request</h1>
      <p class="text-gray-500 mt-1 text-sm">
        Fill in the details below or upload a vendor offer to auto-fill.
      </p>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- Requestor Details -->
      <RequesterDetails
        v-model:requestorName="requestorName"
        v-model:title="title"
        v-model:department="department"
        :requestor-name-attrs="requestorNameAttrs"
        :title-attrs="titleAttrs"
        :department-attrs="departmentAttrs"
        :errors="errors"
        :show-error="showError"
        @fill-dev-data="fillDevRequestorData"
        @field-blur="onFieldBlur"
      />

      <!-- Vendor Details -->
      <VendorDetails
        v-model:vendorName="vendorName"
        v-model:vatId="vatId"
        :vendor-name-attrs="vendorNameAttrs"
        :vat-id-attrs="vatIdAttrs"
        :errors="errors"
        :show-error="showError"
        :is-extracting="isExtracting"
        :extract-error="extractError"
        @field-blur="onFieldBlur"
        @file-upload="handleFileUpload"
      />

      <!-- Order Lines -->
      <OrderLines
        :order-lines="orderLines"
        :values="values"
        :order-lines-error="errors['order_lines'] as string | undefined"
        :submit-attempted="submitAttempted"
        :errors="errors"
        :total-cost="totalCost"
        :extracted-subtotal-net="extractedSubtotalNet"
        :extracted-total-cost="extractedTotalCost"
        :extracted-surcharges="extractedSurcharges"
        @add-line="addOrderLine"
        @remove-line="removeLine"
        @update-line-field="updateLineField"
      />

      <!-- Commodity Group Suggestion -->
      <CommodityGroup
        :commodity-result="commodityResult"
        :commodity-groups="commodityGroups"
        :is-suggesting="isSuggesting"
        :suggest-error="suggestError"
      />

      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <button
          type="submit"
          :disabled="isSubmitting"
          class="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          {{ isSubmitting ? "Submitting..." : "Submit Request" }}
        </button>
      </div>
    </form>
  </div>
</template>
