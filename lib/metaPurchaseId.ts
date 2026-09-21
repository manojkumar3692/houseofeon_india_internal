// Shared by the browser Pixel and the server Conversions API. Never use a
// random ID here: retries and both delivery paths must describe one purchase.
export function metaPurchaseEventId(orderNumber: string): string {
  return `purchase:${orderNumber}`;
}
