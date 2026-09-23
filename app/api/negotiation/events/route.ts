// Reserved until negotiated checkout and provider-authenticated events exist.
// Deliberately disabled in every environment, regardless of existing flags.
export async function POST() {
  return Response.json({ error: 'Events unavailable for read-only connector' }, {
    status: 422, headers: { 'Cache-Control': 'no-store' },
  });
}
