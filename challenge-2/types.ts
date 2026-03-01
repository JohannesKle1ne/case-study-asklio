export interface OrderHeader {
  id: number;
  total_price: number;
  total_price_cents: number;
  total_lines: number;
}

export interface OrderLine {
  description: string;
  price: number;
  price_cents: number;
  originalIndex: number;
}

export interface MatchedOrderLine {
  description: string;
  price: number;
}

export interface MatchedOrder {
  id: number;
  total_price: number;
  total_lines: number;
  order_lines: MatchedOrderLine[];
}
