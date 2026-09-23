export function createConnectorHandler(options: {
  workspaceId: string; installationId: string; secret: string;
  requirements?: string[];
  capabilities: () => Promise<unknown>;
  listCatalog: (input: { cursor: string | null; limit: number }) => Promise<unknown>;
  getContext: (cart: import('../types').Cart) => Promise<unknown>;
  createCheckout: (quote: import('../types').Quote, key: string) => Promise<unknown>;
  reconcile: (id: string) => Promise<unknown>;
  claimNonce: (nonce: string, expires: Date) => Promise<boolean>;
}): (request: Request) => Promise<Response>;
export function sendConnectorEvent(options: {
  platformOrigin: string; installationId: string; secret: string;
  event: { eventId: string; type: string; externalId: string; occurredAt: string };
}): Promise<unknown>;
