import { destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  await destroySession(req.headers);
  return Response.json({ ok: true });
}
