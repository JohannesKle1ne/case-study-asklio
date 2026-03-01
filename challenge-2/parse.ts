import fs from "fs";
import { parse } from "csv-parse/sync";
import { OrderHeader, OrderLine } from "./types";

export function parseHeaderCSV(filePath: string): OrderHeader[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const rawData = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return rawData.map((h, i) => {
    const id = parseInt(h.id);
    const total_price = parseFloat(h.total_price);
    const total_lines = parseInt(h.total_lines);
    if (isNaN(id) || isNaN(total_price) || isNaN(total_lines)) {
      throw new Error(`Invalid header row ${i + 1}: ${JSON.stringify(h)}`);
    }
    return {
      id,
      total_price,
      total_price_cents: Math.round(total_price * 100),
      total_lines,
    };
  });
}

export function parseLineCSV(filePath: string): OrderLine[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const rawData = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return rawData.map((l, index) => {
    const price = parseFloat(l.price);
    if (!l.description || isNaN(price)) {
      throw new Error(`Invalid line row ${index + 1}: ${JSON.stringify(l)}`);
    }
    return {
      description: l.description,
      price,
      price_cents: Math.round(price * 100),
      originalIndex: index,
    };
  });
}
