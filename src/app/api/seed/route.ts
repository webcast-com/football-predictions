import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await ensureSeed();
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Seed failed." }, { status: 500 });
  }
}
