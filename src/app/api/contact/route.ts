import { db } from "@/db";
import { contactMessages } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();
    if (!name || !email || !message) {
      return Response.json(
        { error: "Name, email and message are required." },
        { status: 400 }
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(String(email))) {
      return Response.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (String(message).trim().length < 10) {
      return Response.json(
        { error: "Message must be at least 10 characters." },
        { status: 400 }
      );
    }

    await db.insert(contactMessages).values({
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().toLowerCase().slice(0, 200),
      subject: subject ? String(subject).slice(0, 120) : "",
      message: String(message).trim().slice(0, 5000),
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to send message." }, { status: 500 });
  }
}
