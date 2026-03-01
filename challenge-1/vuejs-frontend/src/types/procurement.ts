export interface OrderLine {
  id?: number;
  position_description: string;
  unit_price: number;
  amount: number;
  unit: string;
  total_price: number;
}

export interface ProcurementRequest {
  id: number;
  requestor_name: string;
  title: string;
  vendor_name: string;
  vat_id: string;
  commodity_group_id: string;
  commodity_group_name: string;
  department: string;
  total_cost: number;
  status: "Open" | "In Progress" | "Closed";
  created_at: string;
  order_lines?: OrderLine[];
  status_history?: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  id: number;
  request_id: number;
  old_status: string | null;
  new_status: string;
  changed_at: string;
}

export interface CommodityGroup {
  id: string;
  category: string;
  name: string;
}

export interface Surcharge {
  label: string;
  amount: number;
}

export interface ExtractedData {
  vendor_name: string | null;
  vat_id: string | null;
  subtotal_net: number | null;
  surcharges: Surcharge[];
  requestor_department: string | null;
  total_cost: number | null;
  order_lines: OrderLine[];
  commodity_suggestion: CommoditySuggestion | null;
}

export interface CommoditySuggestion {
  commodity_group_id: string;
  commodity_group_name: string;
  category: string;
  reasoning: string;
}
