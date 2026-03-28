"use client";
import { useState } from "react";

type GradeEntry = { title: string; category: string; earned: string; possible: string };

export default function GradesPage({ params }: { params: { id: string } }) {
  const [entries, setEntries] = useState<GradeEntry[]>([]);
  const [form, setForm] = useState<GradeEntry>({ title: "", category: "", earned: "", possible: "" });

  function addEntry() {
    if (!form.title || !form.earned || !form.possible) return;
    setEntries((prev) => [...prev, form]);
    setForm({ title: "", category: "", earned: "", possible: "" });
  }

  const totalEarned = entries.reduce((s, e) => s + Number(e.earned), 0);
  const totalPossible = entries.reduce((s, e) => s + Number(e.possible), 0);
  const pct = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grades Dashboard</h1>

      {pct && (
        <div className="border rounded-xl p-5 bg-white text-center">
          <p className="text-4xl font-bold text-brand-600">{pct}%</p>
          <p className="text-gray-500 text-sm mt-1">Current estimated grade ({totalEarned}/{totalPossible} pts)</p>
        </div>
      )}

      <div className="border rounded-xl p-5 bg-white space-y-3">
        <h2 className="font-semibold">Add Grade Entry</h2>
        <div className="grid grid-cols-2 gap-2">
          <input className="border rounded px-2 py-1.5 text-sm col-span-2" placeholder="Assignment title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="border rounded px-2 py-1.5 text-sm" placeholder="Category (e.g. Homework)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="flex gap-2">
            <input className="border rounded px-2 py-1.5 text-sm w-1/2" placeholder="Earned" value={form.earned} onChange={(e) => setForm({ ...form, earned: e.target.value })} />
            <input className="border rounded px-2 py-1.5 text-sm w-1/2" placeholder="Possible" value={form.possible} onChange={(e) => setForm({ ...form, possible: e.target.value })} />
          </div>
        </div>
        <button onClick={addEntry} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm">Add Entry</button>
      </div>

      {entries.length > 0 && (
        <div className="border rounded-xl bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Assignment</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2">{e.title}</td>
                  <td className="px-4 py-2 text-gray-500">{e.category}</td>
                  <td className="px-4 py-2 text-right">{e.earned}/{e.possible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
