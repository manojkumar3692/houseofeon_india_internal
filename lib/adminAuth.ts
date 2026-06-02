export function assertAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.ADMIN_ACCESS_TOKEN || token !== process.env.ADMIN_ACCESS_TOKEN) {
    throw new Error("Unauthorized");
  }
}
