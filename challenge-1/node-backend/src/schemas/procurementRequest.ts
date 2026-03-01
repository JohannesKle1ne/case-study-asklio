import { z } from "zod";

export const orderLineSchema = z.object({
  position_description: z.string().min(1, "Position description is required"),
  unit_price: z.number().positive("Unit price must be positive"),
  amount: z.number().positive("Amount must be positive"),
  unit: z.string().min(1, "Unit is required"),
  total_price: z.number().positive("Total price must be positive"),
});

export const createProcurementRequestSchema = z.object({
  requestor_name: z.string().min(1, "Requestor name is required"),
  title: z.string().min(1, "Title is required"),
  vendor_name: z.string().min(1, "Vendor name is required"),
  vat_id: z
    .string()
    .regex(
      /^[A-Z]{2}[0-9A-Z]{2,12}$/,
      "VAT ID must be a valid EU format (e.g. DE123456789)",
    ),
  commodity_group_id: z.string().min(1, "Commodity group is required"),
  commodity_group_name: z.string().min(1, "Commodity group name is required"),
  department: z.string().min(1, "Department is required"),
  total_cost: z.number().positive("Total cost must be positive"),
  order_lines: z
    .array(orderLineSchema)
    .min(1, "At least one order line is required"),
});

export const updateStatusSchema = z.object({
  status: z.enum(["Open", "In Progress", "Closed"]),
});
