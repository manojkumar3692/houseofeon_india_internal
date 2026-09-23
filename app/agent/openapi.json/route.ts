import { z } from "zod";
import { agentTools } from "@/lib/agents/catalog";
import { SITE_URL } from "@/lib/seo";
export function GET() {
  const document = {
    openapi: "3.1.0",
    info: { title: "House of Eon Public Agent API", version: "1.0.0", description: "Read-only brand catalogue and published policies. No authentication, customer data, checkout actions or model calls. MCP is also available at /agent/mcp." },
    servers: [{ url: SITE_URL }],
    paths: { "/agent/query": { post: {
      operationId: "queryHouseOfEon",
      summary: "Search, inspect or compare perfumes, or read a store policy",
      requestBody: { required: true, content: { "application/json": { schema: {
        oneOf: agentTools.map(tool => ({ type: "object", additionalProperties: false, required: ["tool", "arguments"],
          properties: { tool: { type: "string", const: tool.name, description: tool.description }, arguments: z.toJSONSchema(tool.schema) } })),
      } } } },
      responses: {
        "200": { description: "Brand-sourced result. All product prices are INR single-bottle offers; availability may be unknown. Source URLs and retrieval timestamp included.", content: { "application/json": { schema: { type: "object", required: ["schemaVersion", "source", "retrievedAt", "scope", "supportUrl"], properties: {
          schemaVersion: { type: "string" }, source: { type: "string" }, retrievedAt: { type: "string", format: "date-time" }, scope: { type: "string" }, supportUrl: { type: "string", format: "uri" },
          products: { type: "array", items: { type: "object", additionalProperties: true } }, product: { type: "object", additionalProperties: true }, answer: { type: "string" }, sourceUrl: { type: "string", format: "uri" },
        }, additionalProperties: true } } } },
        "400": { description: "Unknown tool/product or invalid arguments/JSON." },
        "403": { description: "Browser origin not permitted." }, "413": { description: "Body exceeds 8 KiB." },
        "415": { description: "Content-Type must be application/json." }, "429": { description: "Retry after 60 seconds." },
        "500": { description: "Temporary service failure." },
      },
    } } },
  };
  return Response.json(document, { headers: { "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" } });
}
