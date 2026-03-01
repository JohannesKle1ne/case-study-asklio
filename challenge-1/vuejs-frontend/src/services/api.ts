import type {
  ProcurementRequest,
  ExtractedData,
  CommoditySuggestion,
  CommodityGroup,
} from "@/types/procurement";
export type { CommodityGroup } from "@/types/procurement";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchRequests(): Promise<ProcurementRequest[]> {
  const res = await fetch(`${BASE_URL}/procurementRequests`);
  return handleResponse<ProcurementRequest[]>(res);
}

export async function fetchRequest(id: number): Promise<ProcurementRequest> {
  const res = await fetch(`${BASE_URL}/procurementRequests/${id}`);
  return handleResponse<ProcurementRequest>(res);
}

export async function createRequest(
  data: Omit<ProcurementRequest, "id" | "status" | "created_at"> & {
    order_lines: Array<Omit<import("@/types/procurement").OrderLine, "id">>;
  },
): Promise<ProcurementRequest> {
  const res = await fetch(`${BASE_URL}/procurementRequests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ProcurementRequest>(res);
}

export async function updateRequestStatus(
  id: number,
  status: "Open" | "In Progress" | "Closed",
): Promise<ProcurementRequest> {
  const res = await fetch(`${BASE_URL}/procurementRequests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse<ProcurementRequest>(res);
}

export async function extractFromPdf(file: File): Promise<ExtractedData> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/extract`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<ExtractedData>(res);
}

export async function fetchCommodityGroups(): Promise<CommodityGroup[]> {
  const res = await fetch(`${BASE_URL}/commodity-groups`);
  return handleResponse<CommodityGroup[]>(res);
}

export async function suggestCommodity(descriptions: string[]): Promise<CommoditySuggestion> {
  const res = await fetch(`${BASE_URL}/suggest-commodity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ descriptions }),
  });
  return handleResponse<CommoditySuggestion>(res);
}
