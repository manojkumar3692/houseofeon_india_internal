import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { agentTools, AgentInputError, runAgentTool } from "@/lib/agents/catalog";
import { checkAgentRequest, readAgentBody, agentHeaders, httpFailure, agentOptions } from "@/lib/agents/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;
export async function POST(request: Request) {
  let server: McpServer | undefined;
  try {
    checkAgentRequest(request);
    const body = await readAgentBody(request);
    server = new McpServer({ name: "house-of-eon", version: "1.0.0" });
    for (const tool of agentTools) {
      server.registerTool(tool.name, {
        description: tool.description, inputSchema: tool.schema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      }, async (args: Record<string, unknown>) => {
        try {
          const result = await runAgentTool(tool.name, args);
          return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
        } catch (error) {
          return { isError: true, content: [{ type: "text" as const, text: error instanceof AgentInputError ? error.message : "Public catalogue temporarily unavailable. Use https://www.houseofeon.in/contact for support." }] };
        }
      });
    }
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    const response = await transport.handleRequest(request, { parsedBody: body });
    // Consume the JSON-only response before closing its request-local transport.
    const payload = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(agentHeaders(request))) headers.set(key, value);
    return new Response(response.status === 202 || response.status === 204 ? null : payload, { status: response.status, headers });
  } catch (error) { return httpFailure(error); }
  finally { await server?.close(); }
}
// This stateless JSON transport doesn't provide a persistent SSE stream.
export function GET() { return new Response(null, { status: 405, headers: { Allow: "POST, OPTIONS", ...agentHeaders() } }); }
export const OPTIONS = agentOptions;
