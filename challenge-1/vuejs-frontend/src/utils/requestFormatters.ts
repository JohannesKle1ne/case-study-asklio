import type { StatusHistoryEntry } from "@/types/procurement";

export function statusColor(status: string): string {
  switch (status) {
    case "Open":
      return "bg-blue-100 text-blue-700";
    case "In Progress":
      return "bg-amber-100 text-amber-700";
    case "Closed":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function historyLabel(entry: StatusHistoryEntry): string {
  if (!entry.old_status) return `Created as ${entry.new_status}`;
  return `${entry.old_status} → ${entry.new_status}`;
}
