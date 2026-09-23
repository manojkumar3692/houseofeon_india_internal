// No secrets are returned to clients; caller is a server route only.
export function connectorConfig(env: Record<string, string | undefined>) {
  if (env.NEGOTIATION_CONNECTOR_ENABLED !== 'true') return null;
  const workspaceId = env.NEGOTIATION_WORKSPACE_ID;
  const installationId = env.NEGOTIATION_INSTALLATION_ID;
  const current = env.NEGOTIATION_CONNECTOR_SECRET;
  const legacy = env.NEGOTIATION_INSTALLATION_SECRET;
  if (current && legacy && current !== legacy) return null;
  const secret = current || legacy;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!workspaceId || !installationId || !uuid.test(workspaceId) || !uuid.test(installationId) ||
      !secret || secret.length < 32 || secret.trim() !== secret) return null;
  return { workspaceId, installationId, secret };
}
