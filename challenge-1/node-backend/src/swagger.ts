const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Procurement API",
      version: "1.0.0",
      description: "Backend API for the Procurement Request App",
    },
    servers: [{ url: "http://localhost:3001" }],
    components: {
      schemas: {
        OrderLine: {
          type: "object",
          properties: {
            id: { type: "integer" },
            request_id: { type: "integer" },
            position_description: { type: "string" },
            unit_price: { type: "number" },
            amount: { type: "number" },
            unit: { type: "string" },
            total_price: { type: "number" },
          },
        },
        OrderLineInput: {
          type: "object",
          required: [
            "position_description",
            "unit_price",
            "amount",
            "unit",
            "total_price",
          ],
          properties: {
            position_description: { type: "string" },
            unit_price: { type: "number" },
            amount: { type: "number" },
            unit: { type: "string" },
            total_price: { type: "number" },
          },
        },
        StatusHistoryEntry: {
          type: "object",
          properties: {
            id: { type: "integer" },
            request_id: { type: "integer" },
            old_status: { type: "string", nullable: true },
            new_status: { type: "string" },
            changed_at: { type: "string", format: "date-time" },
          },
        },
        ProcurementRequest: {
          type: "object",
          properties: {
            id: { type: "integer" },
            requestor_name: { type: "string" },
            title: { type: "string" },
            vendor_name: { type: "string" },
            vat_id: { type: "string", nullable: true },
            commodity_group_id: { type: "string", nullable: true },
            commodity_group_name: { type: "string", nullable: true },
            department: { type: "string", nullable: true },
            total_cost: { type: "number" },
            status: { type: "string", enum: ["Open", "In Progress", "Closed"] },
            created_at: { type: "string", format: "date-time" },
          },
        },
        ProcurementRequestDetail: {
          allOf: [
            { $ref: "#/components/schemas/ProcurementRequest" },
            {
              type: "object",
              properties: {
                order_lines: {
                  type: "array",
                  items: { $ref: "#/components/schemas/OrderLine" },
                },
                status_history: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StatusHistoryEntry" },
                },
              },
            },
          ],
        },
        CreateProcurementRequestBody: {
          type: "object",
          required: [
            "requestor_name",
            "title",
            "vendor_name",
            "total_cost",
            "order_lines",
          ],
          properties: {
            requestor_name: { type: "string" },
            title: { type: "string" },
            vendor_name: { type: "string" },
            vat_id: { type: "string" },
            commodity_group_id: { type: "string" },
            commodity_group_name: { type: "string" },
            department: { type: "string" },
            total_cost: { type: "number" },
            order_lines: {
              type: "array",
              items: { $ref: "#/components/schemas/OrderLineInput" },
            },
          },
        },
        UpdateStatusBody: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["Open", "In Progress", "Closed"] },
          },
        },
        CommoditySuggestion: {
          type: "object",
          properties: {
            commodity_group_id: { type: "string" },
            commodity_group_name: { type: "string" },
            category: { type: "string" },
            reasoning: { type: "string" },
          },
        },
        ExtractionResult: {
          type: "object",
          properties: {
            vendor_name: { type: "string", nullable: true },
            vat_id: { type: "string", nullable: true },
            subtotal_net: { type: "number", nullable: true },
            surcharges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  amount: { type: "number" },
                },
              },
            },
            requestor_department: { type: "string", nullable: true },
            total_cost: { type: "number", nullable: true },
            order_lines: {
              type: "array",
              items: { $ref: "#/components/schemas/OrderLineInput" },
            },
            commodity_suggestion: {
              nullable: true,
              allOf: [{ $ref: "#/components/schemas/CommoditySuggestion" }],
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/api/procurementRequests": {
        get: {
          tags: ["Procurement Requests"],
          summary: "List all procurement requests",
          responses: {
            "200": {
              description: "Array of procurement requests",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ProcurementRequest" },
                  },
                },
              },
            },
            "500": {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Procurement Requests"],
          summary: "Create a new procurement request",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateProcurementRequestBody",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created procurement request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProcurementRequest" },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/procurementRequests/{id}": {
        get: {
          tags: ["Procurement Requests"],
          summary: "Get a single procurement request by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            "200": {
              description:
                "Procurement request with order lines and status history",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ProcurementRequestDetail",
                  },
                },
              },
            },
            "404": {
              description: "Not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/procurementRequests/{id}/status": {
        patch: {
          tags: ["Procurement Requests"],
          summary: "Update the status of a procurement request",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateStatusBody" },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated procurement request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProcurementRequest" },
                },
              },
            },
            "400": {
              description: "Validation error or status already set",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/extract": {
        post: {
          tags: ["Extract"],
          summary: "Extract procurement data from a PDF vendor offer",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file"],
                  properties: {
                    file: {
                      type: "string",
                      format: "binary",
                      description: "PDF file (max 10 MB)",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Extracted procurement data with optional commodity suggestion",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ExtractionResult" },
                },
              },
            },
            "400": {
              description: "No file uploaded or invalid file type",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Extraction failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/suggest-commodity": {
        post: {
          tags: ["Suggest Commodity"],
          summary: "Suggest a commodity group for a list of item descriptions",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["descriptions"],
                  properties: {
                    descriptions: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of item/position descriptions",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Best matching commodity group",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CommoditySuggestion" },
                },
              },
            },
            "400": {
              description: "Missing or invalid descriptions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Suggestion failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = options.definition;
