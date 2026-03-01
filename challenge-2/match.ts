import { OrderHeader, OrderLine, MatchedOrder } from "./types";

export function solve(
  headers: OrderHeader[],
  availableLines: OrderLine[],
): MatchedOrder[][] {
  // Sort ascending so pruning bounds hold and combinations are explored in canonical order
  const sortedLines = [...availableLines].sort((a, b) => {
    if (a.price_cents !== b.price_cents) return a.price_cents - b.price_cents;
    return a.description.localeCompare(b.description);
  });

  // Process headers with the lowest average price per line first to prune earlier
  const sortedHeaders = [...headers].sort(
    (a, b) =>
      a.total_price_cents / a.total_lines - b.total_price_cents / b.total_lines,
  );

  const solutions: MatchedOrder[][] = [];

  function backtrack(
    headerIndex: number,
    linePool: OrderLine[],
    searchFrom: number,
    combo: OrderLine[],
    comboSum: number,
    matches: MatchedOrder[],
  ): void {
    const header = sortedHeaders[headerIndex];
    const needed = header.total_lines - combo.length;

    if (needed === 0) {
      if (comboSum === header.total_price_cents) {
        const comboIndices = new Set(combo.map((l) => l.originalIndex));
        const unusedLines = linePool.filter(
          (l) => !comboIndices.has(l.originalIndex),
        );

        matches.push({
          id: header.id,
          total_price: header.total_price,
          total_lines: header.total_lines,
          order_lines: combo.map((l) => ({
            description: l.description,
            price: l.price,
          })),
        });

        if (headerIndex + 1 === sortedHeaders.length) {
          solutions.push(structuredClone(matches));
        } else {
          backtrack(headerIndex + 1, unusedLines, 0, [], 0, matches);
        }

        matches.pop();
      }
      return;
    }

    for (let i = searchFrom; i < linePool.length; i++) {
      const line = linePool[i];

      // Skip early if even the cheapest remaining items exceed the target
      if (i + needed <= linePool.length) {
        let minPossible = comboSum;
        for (let j = i; j < i + needed; j++) {
          minPossible += linePool[j].price_cents;
        }
        if (minPossible > header.total_price_cents) break;
      }

      const nextSum = comboSum + line.price_cents;
      if (nextSum > header.total_price_cents) break;
      // Skip if the budget left cannot be filled by the required number of remaining items
      const remainingBudget = header.total_price_cents - nextSum;
      if (remainingBudget < line.price_cents * (needed - 1)) continue;

      combo.push(line);
      backtrack(headerIndex, linePool, i + 1, combo, nextSum, matches);
      combo.pop();
    }
  }

  // Kick off search for the first header using all available lines
  backtrack(0, sortedLines, 0, [], 0, []);

  return solutions;
}
