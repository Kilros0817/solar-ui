"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function ContractDetail({ params }) {
  const { id } = params;
  const [contract, setContract] = useState(null);

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem("contracts") || "[]");
      const found = all.find((c) => c.id === id);
      setContract(found || null);
    } catch (e) {
      setContract(null);
    }
  }, [id]);

  if (!contract) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <p>Contract not found.</p>
        <Link className="text-blue-600 hover:underline" href="/contracts/new">Create a new contract</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{contract.title}</h1>
        <Link className="text-sm text-[var(--primary)] hover:underline" href="/dashboard">Dashboard</Link>
      </div>

      <Card>
        <CardHeader>
          <div className="font-medium">Overview</div>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--muted)]">{contract.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="rounded-lg border border-[var(--border)] p-3 bg-white/80">
              <div className="text-xs text-[var(--muted)]">Value</div>
              <div className="font-medium">{contract.contractValue}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-white/80">
              <div className="text-xs text-[var(--muted)]">Priority</div>
              <div className="font-medium mt-1"><PriorityBadge priority={contract.priority} /></div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-white/80">
              <div className="text-xs text-[var(--muted)]">Created</div>
              <div className="font-medium">{new Date(contract.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="font-medium">Divisions & Sections</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contract.divisions.map((div) => (
              <div key={div.id} className="rounded-lg border border-[var(--border)] p-4 bg-white/70">
                <h3 className="font-medium mb-2">{div.name}</h3>
                {div.sections.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No sections.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    {div.sections.map((s, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{s.title}</span>
                        {s.notes ? <span className="text-[var(--muted)]"> — {s.notes}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const mapping = {
    Low: { variant: "green", label: "Approved" },
    Medium: { variant: "yellow", label: "Pending" },
    High: { variant: "red", label: "Requires Action" },
    Critical: { variant: "red", label: "Requires Action" },
  };
  const m = mapping[priority] || { variant: "default", label: priority };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}


