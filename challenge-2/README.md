# Order Matcher

Reconnects lost links between order headers and order lines by finding all valid combinations where the sum of line prices equals the header's `total_price` and the count matches `total_lines`.

## Algorithm

Uses backtracking with pruning over a sorted line pool. All globally valid assignments across all headers are enumerated and returned.

## Usage

```bash
npm install
npm start       # runs main.ts against test case 1
npm test        # runs all three test cases
```

## Input

- **Order Headers CSV** — columns: `id`, `total_price`, `total_lines`
- **Order Lines CSV** — columns: `description`, `price`

To change the input files, edit the paths in `main.ts`.

## Output

A JSON array of solutions. Each solution is a list of matched orders, each containing its `id`, `total_price`, `total_lines`, and matched `order_lines`.
