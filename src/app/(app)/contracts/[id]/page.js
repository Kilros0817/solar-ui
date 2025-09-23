"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function ContractDetail({ params }) {
  const { id } = use(params);
  const [contract, setContract] = useState(null);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClauses, setEditedClauses] = useState({});

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("sessionUser") || "null");
      setUser(stored);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem("contracts") || "[]");
      const found = all.find((c) => c.id === id);
      setContract(found || null);
    } catch (e) {
      setContract(null);
    }
  }, [id]);

  function handleEditToggle() {
    if (!isEditing) {
      // Initialize edited clauses with current values
      const initialEditedClauses = {};
      if (contract?.divisions) {
        contract.divisions.forEach(div => {
          div.sections.forEach(section => {
            if (section.clauses) {
              section.clauses.forEach((clause, clauseIdx) => {
                const key = `${div.id}-${section.title}-${clauseIdx}`;
                initialEditedClauses[key] = clause;
              });
            }
          });
        });
      }
      setEditedClauses(initialEditedClauses);
    }
    setIsEditing(!isEditing);
  }

  function handleClauseChange(divId, sectionTitle, clauseIdx, newValue) {
    const key = `${divId}-${sectionTitle}-${clauseIdx}`;
    setEditedClauses(prev => ({
      ...prev,
      [key]: newValue
    }));
  }

  function handleSaveChanges() {
    if (!contract) return;

    try {
      const allContracts = JSON.parse(localStorage.getItem("contracts") || "[]");
      const contractIndex = allContracts.findIndex(c => c.id === contract.id);
      
      if (contractIndex === -1) return;

      // Update the contract with edited clauses
      const updatedContract = { ...contract };
      updatedContract.divisions = updatedContract.divisions.map(div => ({
        ...div,
        sections: div.sections.map(section => ({
          ...section,
          clauses: section.clauses.map((clause, clauseIdx) => {
            const key = `${div.id}-${section.title}-${clauseIdx}`;
            return editedClauses[key] || clause;
          })
        }))
      }));

      allContracts[contractIndex] = updatedContract;
      localStorage.setItem("contracts", JSON.stringify(allContracts));
      
      setContract(updatedContract);
      setIsEditing(false);
      setEditedClauses({});
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditedClauses({});
  }

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
        <div>
          <h1 className="text-2xl font-semibold">{contract.title}</h1>
          {contract.clientCompany && (
            <p className="text-[var(--muted)] mt-1">Client/Company: {contract.clientCompany}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleCancelEdit} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} size="sm">
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleEditToggle} size="sm">
                Edit Contract
              </Button>
              <Link className="text-sm text-[var(--primary)] hover:underline" href="/dashboard">Dashboard</Link>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="font-medium">Overview</div>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--muted)]">{contract.description}</p>
          <div className={`grid grid-cols-1 gap-4 mt-4 ${user?.role !== "Division Leader" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {user?.role !== "Division Leader" && (
              <div className="rounded-lg border border-[var(--border)] p-3 bg-white/80">
                <div className="text-xs text-[var(--muted)]">Value</div>
                <div className="font-medium">${contract.contractValue?.toLocaleString() || '0'}</div>
              </div>
            )}
            <div className="rounded-lg border border-[var(--border)] p-3 bg-white/80">
              <div className="text-xs text-[var(--muted)]">Priority</div>
              <div className="font-medium mt-1"><PriorityBadge priority={contract.priority} /></div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-white/80">
              <div className="text-xs text-[var(--muted)]">Created</div>
              <div className="font-medium">{new Date(contract.createdAt).toLocaleString()}</div>
            </div>
            {contract.assignedDivision && (
              <div className="rounded-lg border border-[var(--border)] p-3 bg-white/80">
                <div className="text-xs text-[var(--muted)]">Assigned Division</div>
                <div className="font-medium capitalize">{contract.assignedDivision}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="font-medium">Divisions & Sections</div>
            {isEditing && (
              <div className="flex items-center gap-2 text-sm text-[var(--primary)]">
                <div className="w-2 h-2 bg-[var(--primary)] rounded-full"></div>
                <span>Edit Mode</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contract.divisions.map((div) => (
              <div key={div.id} className="rounded-lg border border-[var(--border)] p-4 bg-white/70">
                <h3 className="font-medium mb-2">{div.name}</h3>
                {div.sections.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No sections.</p>
                ) : (
                  <div className="space-y-3">
                    {div.sections.map((s, idx) => (
                      <div key={idx} className="border-l-2 border-[var(--border)] pl-3">
                        <div className="font-medium mb-2">{s.title}</div>
                        {s.clauses && s.clauses.length > 0 ? (
                          <div className="space-y-2">
                            {s.clauses.map((clause, clauseIdx) => {
                              const key = `${div.id}-${s.title}-${clauseIdx}`;
                              const currentValue = editedClauses[key] || clause;
                              
                              return (
                                <div key={clauseIdx} className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                                  {isEditing ? (
                                    <textarea
                                      value={currentValue}
                                      onChange={(e) => handleClauseChange(div.id, s.title, clauseIdx, e.target.value)}
                                      className="flex-1 p-2 border border-[var(--border)] rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                                      rows={2}
                                      placeholder="Enter clause content..."
                                    />
                                  ) : (
                                    <span className="text-sm text-[var(--muted)] leading-relaxed">{clause}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--muted)]">No clauses defined.</p>
                        )}
                      </div>
                    ))}
                  </div>
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


