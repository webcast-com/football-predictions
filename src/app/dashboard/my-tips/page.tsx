"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/client-auth";
import {
  PredictionCard,
  PredictionModal,
  CardSkeleton,
  type PredictionDTO,
  type FormData,
} from "@/components/predictions-ui";

export default function MyTipsPage() {
  const [items, setItems] = useState<PredictionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PredictionDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function load() {
    const res = await authFetch("/api/predictions?scope=mine");
    const data = await res.json();
    setItems(data.predictions || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(p: PredictionDTO) {
    setEditing(p);
    setModalOpen(true);
  }

  async function save(form: FormData) {
    setSaving(true);
    const payload = { ...form, odds: Number(form.odds) };
    try {
      if (editing) {
        // optimistic update
        const optimistic = { ...editing, ...payload } as PredictionDTO;
        setItems((prev) => prev.map((p) => (p.id === editing.id ? optimistic : p)));
        const res = await authFetch(`/api/predictions/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setItems((prev) => prev.map((p) => (p.id === editing.id ? data.prediction : p)));
        flash("Prediction updated");
      } else {
        const res = await authFetch("/api/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setItems((prev) => [data.prediction, ...prev]);
        flash("Prediction created");
      }
      setModalOpen(false);
    } catch {
      flash("Something went wrong");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: PredictionDTO) {
    if (!confirm(`Delete ${p.homeTeam} vs ${p.awayTeam}?`)) return;
    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== p.id)); // optimistic
    const res = await authFetch(`/api/predictions/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(prev);
      flash("Failed to delete");
    } else {
      flash("Prediction deleted");
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tips</h1>
          <p className="text-sm text-slate-400">Create and manage your own predictions.</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400"
        >
          + New prediction
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-14 text-center">
          <p className="text-4xl">✍️</p>
          <p className="mt-3 text-lg font-semibold text-white">No tips yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            Share your own football predictions. Track them and build your win-rate.
          </p>
          <button
            onClick={openNew}
            className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400"
          >
            Create your first tip
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PredictionCard key={p.id} p={p} onEdit={openEdit} onDelete={remove} />
          ))}
        </div>
      )}

      <PredictionModal
        open={modalOpen}
        initial={editing}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={save}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#0a0f1d] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
