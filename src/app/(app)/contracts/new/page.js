"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function NewContractPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [clientCompany, setClientCompany] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const [divisionSections, setDivisionSections] = useState({});

  const availableDivisions = useMemo(
    () => [
      { id: "legal", name: "Legal" },
      { id: "finance", name: "Finance" },
      { id: "procurement", name: "Procurement" },
      { id: "operations", name: "Operations" },
      { id: "compliance", name: "Compliance" },
    ],
    []
  );

  function validate() {
    const next = {};
    if (!title.trim()) next.title = "Title is required";
    if (!description.trim()) next.description = "Description is required";
    if (contractValue === "" || Number(contractValue) < 0) next.contractValue = "Enter a non-negative value";
    if (!clientCompany.trim()) next.clientCompany = "Client/Company is required";
    return next;
  }

  function handleContinue() {
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    const sectionIssues = selectedDivisions.filter((divId) => {
      const sections = divisionSections[divId] || [];
      return sections.length === 0 || sections.some((s) => !s.title?.trim());
    });
    if (selectedDivisions.length === 0) {
      alert("Select at least one division.");
      return;
    }
    if (sectionIssues.length > 0) {
      alert("Add at least one titled section per selected division.");
      return;
    }
    const newContract = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      contractValue: Number(contractValue),
      priority,
      clientCompany: clientCompany.trim(),
      divisions: selectedDivisions.map((divId) => ({
        id: divId,
        name: availableDivisions.find((d) => d.id === divId)?.name || divId,
        sections: (divisionSections[divId] || []).map((s) => ({
          title: s.title.trim(),
          clauses: (s.clauses || []).map(c => c.trim()).filter(c => c.length > 0),
        })),
      })),
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("contracts") || "[]");
      existing.push(newContract);
      localStorage.setItem("contracts", JSON.stringify(existing));
      router.push(`/contracts/${newContract.id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to save. Check console.");
    }
  }

  function toggleDivision(divId) {
    setSelectedDivisions((prev) =>
      prev.includes(divId) ? prev.filter((id) => id !== divId) : [...prev, divId]
    );
    setDivisionSections((prev) => {
      if (prev[divId]) return prev;
      return { ...prev, [divId]: [] };
    });
  }

  function addSection(divId) {
    setDivisionSections((prev) => {
      const next = [...(prev[divId] || [])];
      next.push({ title: "", clauses: [] });
      return { ...prev, [divId]: next };
    });
  }

  function updateSection(divId, index, field, value) {
    setDivisionSections((prev) => {
      const next = [...(prev[divId] || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [divId]: next };
    });
  }

  function removeSection(divId, index) {
    setDivisionSections((prev) => {
      const next = [...(prev[divId] || [])];
      next.splice(index, 1);
      return { ...prev, [divId]: next };
    });
  }

  function addClause(divId, sectionIndex) {
    setDivisionSections((prev) => {
      const next = [...(prev[divId] || [])];
      next[sectionIndex] = {
        ...next[sectionIndex],
        clauses: [...(next[sectionIndex].clauses || []), ""]
      };
      return { ...prev, [divId]: next };
    });
  }

  function updateClause(divId, sectionIndex, clauseIndex, value) {
    setDivisionSections((prev) => {
      const next = [...(prev[divId] || [])];
      next[sectionIndex].clauses[clauseIndex] = value;
      return { ...prev, [divId]: next };
    });
  }

  function removeClause(divId, sectionIndex, clauseIndex) {
    setDivisionSections((prev) => {
      const next = [...(prev[divId] || [])];
      next[sectionIndex].clauses.splice(clauseIndex, 1);
      return { ...prev, [divId]: next };
    });
  }

  return (
    <div className="mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Contract</h1>
        <Link className="text-sm text-[var(--primary)] hover:underline" href="/dashboard">Dashboard</Link>
      </div>

      <Card>
        <CardHeader>
          <div className="font-medium">Contract Details</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 bg-white text-[var(--foreground)]"
                placeholder="Contract title"
              />
              {errors.title && <p className="text-red-600 text-sm">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Client/Company</label>
              <input
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 bg-white text-[var(--foreground)]"
                placeholder="Enter client or company name"
              />
              {errors.clientCompany && <p className="text-red-600 text-sm">{errors.clientCompany}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 bg-white text-[var(--foreground)] min-h-28"
                placeholder="Describe the contract"
              />
              {errors.description && <p className="text-red-600 text-sm">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Contract Value</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 bg-white text-[var(--foreground)]"
                  placeholder="0.00"
                />
                {errors.contractValue && (
                  <p className="text-red-600 text-sm">{errors.contractValue}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 bg-white text-[var(--foreground)]"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="font-medium">Divisions & Sections</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Divisions</label>
              <div className="flex flex-wrap gap-2">
                {availableDivisions.map((div) => (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => toggleDivision(div.id)}
                    className={
                      "px-3 py-1.5 rounded-lg border " +
                      (selectedDivisions.includes(div.id)
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white text-[var(--foreground)] border-[var(--border)] hover:bg-black/5")
                    }
                  >
                    {div.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedDivisions.length > 0 && (
              <div className="space-y-6">
                {selectedDivisions.map((divId) => {
                  const div = availableDivisions.find((d) => d.id === divId);
                  const sections = divisionSections[divId] || [];
                  return (
                    <div key={divId} className="rounded-xl border border-[var(--border)] p-4 bg-white/70">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{div?.name} Sections</h3>
                        <Button size="sm" variant="outline" onClick={() => addSection(divId)}>Add Section</Button>
                      </div>

                      {sections.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">No sections yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {sections.map((section, idx) => (
                            <div key={idx} className="rounded-lg border border-[var(--border)] p-4 bg-white/50">
                              <div className="flex gap-2 mb-3">
                                <input
                                  value={section.title}
                                  onChange={(e) =>
                                    updateSection(divId, idx, "title", e.target.value)
                                  }
                                  className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 bg-white text-[var(--foreground)]"
                                  placeholder="Section title"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => removeSection(divId, idx)}
                                >
                                  Remove
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium text-[var(--muted)]">Clauses</label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addClause(divId, idx)}
                                  >
                                    Add Clause
                                  </Button>
                                </div>
                                
                                {section.clauses && section.clauses.length > 0 ? (
                                  <div className="space-y-2">
                                    {section.clauses.map((clause, clauseIdx) => (
                                      <div key={clauseIdx} className="flex gap-2">
                                        <input
                                          value={clause}
                                          onChange={(e) =>
                                            updateClause(divId, idx, clauseIdx, e.target.value)
                                          }
                                          className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 bg-white text-[var(--foreground)] text-sm"
                                          placeholder="Enter clause text"
                                        />
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => removeClause(divId, idx, clauseIdx)}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-[var(--muted)]">No clauses yet. Click "Add Clause" to add one.</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2">
              <Button type="button" onClick={handleContinue}>Confirm</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


