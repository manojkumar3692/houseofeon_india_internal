import { z } from "zod";
import { AgentInputError, runAgentTool } from "@/lib/agents/catalog";
import { checkAgentRequest, readAgentBody, agentHeaders, httpFailure, agentOptions } from "@/lib/agents/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;
const requestSchema = z.object({ tool: z.string().max(60), arguments: z.record(z.string(), z.unknown()) }).strict();
export async function POST(request: Request) {
  try {
    checkAgentRequest(request);
    const { tool, arguments: args } = requestSchema.parse(await readAgentBody(request));
    return Response.json(await runAgentTool(tool, args), { headers: agentHeaders(request) });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof AgentInputError) {
      return Response.json({ error: "Invalid tool or arguments. See /agent/openapi.json." }, { status: 400, headers: agentHeaders() });
    }
    return httpFailure(error);
  }
}
export const OPTIONS = agentOptions;
