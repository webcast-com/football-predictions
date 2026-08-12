"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Support");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const field =
    "w-full rounded-lg border border-white/10 bg-[#0a0f1d] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500";
  const label = "mb-1.5 block text-sm font-medium text-slate-300";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to send. Please try again.");
        setState("error");
        return;
      }
      setState("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex h-full flex-col items-center justify-center py-12 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-3xl">✉️</span>
        <h2 className="mt-4 text-xl font-bold text-white">Message sent</h2>
        <p className="mt-2 max-w-xs text-sm text-slate-400">
          Thanks for reaching out — we&apos;ll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setState("idle")}
          className="mt-6 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-bold text-white">Send a message</h2>

      {state === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Your name" />
        </div>
        <div>
          <label className={label}>Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label className={label}>Subject</label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className={field}>
          <option>Support</option>
          <option>Payment issue</option>
          <option>Premium subscription</option>
          <option>Partnership</option>
          <option>Feedback</option>
        </select>
      </div>
      <div>
        <label className={label}>Message</label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={field}
          placeholder="How can we help?"
        />
      </div>
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400 disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
