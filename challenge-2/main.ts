import path from "path";
import { parseHeaderCSV, parseLineCSV } from "./parse";
import { solve } from "./match";

const headersPath = path.join(__dirname, "1_order_headers.csv");
const linesPath = path.join(__dirname, "1_order_lines.csv");

const headers = parseHeaderCSV(headersPath);
const lines = parseLineCSV(linesPath);

const solutions = solve(headers, lines);

console.log(JSON.stringify(solutions, null, 2));
