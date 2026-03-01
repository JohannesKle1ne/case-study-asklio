import { solve } from "./match";
import { parseHeaderCSV, parseLineCSV } from "./parse";
import fs from "fs";

describe("Order Matcher", () => {
  describe("Test Case 1: Simple example from README", () => {
    test("should find exactly 3 valid solutions", () => {
      const headers = parseHeaderCSV("1_order_headers.csv");
      const lines = parseLineCSV("1_order_lines.csv");
      const solutions = solve(headers, lines);

      const expected = JSON.parse(
        fs.readFileSync("expected-test-case-1.json", "utf8"),
      );

      expect(solutions).toEqual(expected);
    });
  });

  describe("Test Case 2: Normal order headers and lines", () => {
    test("should find exactly 1 valid solution", () => {
      const headers = parseHeaderCSV("2_order_headers.csv");
      const lines = parseLineCSV("2_order_lines.csv");
      const solutions = solve(headers, lines);

      const expected = JSON.parse(
        fs.readFileSync("expected-test-case-2.json", "utf8"),
      );

      expect(solutions).toEqual(expected);
    });
  });

  describe("Test Case 3: Custom order headers and lines", () => {
    test("should find exactly 3 valid solutions", () => {
      const headers = parseHeaderCSV("3_order_headers.csv");
      const lines = parseLineCSV("3_order_lines.csv");
      const solutions = solve(headers, lines);

      const expected = JSON.parse(
        fs.readFileSync("expected-test-case-3.json", "utf8"),
      );

      expect(solutions).toEqual(expected);
    });
  });
});
