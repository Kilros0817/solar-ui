"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Empty from "@/components/ui/Empty";
import { seedContracts, seedMembers } from "@/lib/seedData";

export default function DivisionMemberContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [myClauses, setMyClauses] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("sessionUser") || "null");
      setUser(stored);
    } catch {
      setUser(null);
    }
    // Seed dummy data
    seedContracts();
    seedMembers();
  }, []);

  useEffect(() => {
    if (!user) return;

    try {
      const allContracts = JSON.parse(localStorage.getItem("contracts") || "[]");
      
      // Find all clauses assigned to this member
      const assignedClauses = [];
      
      allContracts.forEach(contract => {
        if (contract.clauseAllocations) {
          Object.keys(contract.clauseAllocations).forEach(divisionId => {
            if (contract.clauseAllocations[divisionId]) {
              Object.keys(contract.clauseAllocations[divisionId]).forEach(sectionTitle => {
                const allocations = contract.clauseAllocations[divisionId][sectionTitle];
                allocations.forEach(allocation => {
                  if (allocation.assignedTo === user.id) {
                    // Find the contract division and section to get the clause text
                    const contractDivision = contract.divisions?.find(div => div.id === divisionId);
                    if (contractDivision) {
                      const section = contractDivision.sections?.find(sec => sec.title === sectionTitle);
                      if (section && section.clauses[allocation.clauseIndex]) {
                        assignedClauses.push({
                          contractId: contract.id,
                          contractTitle: contract.title,
                          contractDescription: contract.description,
                          contractPriority: contract.priority,
                          clientCompany: contract.clientCompany,
                          createdAt: contract.createdAt,
                          divisionId: divisionId,
                          divisionName: contractDivision.name,
                          sectionTitle: sectionTitle,
                          clauseIndex: allocation.clauseIndex,
                          clauseText: section.clauses[allocation.clauseIndex],
                          assignedAt: allocation.assignedAt
                        });
                      }
                    }
                  }
                });
              });
            }
          });
        }
      });
      
      setMyClauses(assignedClauses);
    } catch (error) {
      console.error("Error loading assigned clauses:", error);
      setMyClauses([]);
    }
  }, [user]);

  const filteredClauses = useMemo(() => {
    if (filter === "all") return myClauses;
    return myClauses.filter(clause => clause.contractPriority === filter);
  }, [myClauses, filter]);

  const filterOptions = [
    { value: "all", label: "All Clauses" },
    { value: "Low", label: "Approved" },
    { value: "Medium", label: "Pending" },
    { value: "High", label: "Requires Action" },
    { value: "Critical", label: "Critical" },
  ];

  function PriorityBadge({ priority }) {
    const mapping = {
      Low: { variant: "green", label: "Approved" },
      Medium: { variant: "yellow", label: "Pending" },
      High: { variant: "red", label: "Requires Action" },
      Critical: { variant: "red", label: "Critical" },
    };
    const m = mapping[priority] || { variant: "default", label: priority };
    return <Badge variant={m.variant}>{m.label}</Badge>;
  }

  function StatusBadge({ assignedAt }) {
    const daysSinceAssigned = Math.floor((new Date() - new Date(assignedAt)) / (1000 * 60 * 60 * 24));
    
    if (daysSinceAssigned <= 1) {
      return <Badge variant="green">New</Badge>;
    } else if (daysSinceAssigned <= 3) {
      return <Badge variant="yellow">Recent</Badge>;
    } else if (daysSinceAssigned <= 7) {
      return <Badge variant="orange">Due Soon</Badge>;
    } else {
      return <Badge variant="red">Overdue</Badge>;
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--muted)]">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Assigned Clauses</h1>
          <p className="text-[var(--muted)] mt-1">
            {user.name} - {user.role || 'Division Member'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="font-medium">Assigned Clauses ({myClauses.length})</div>
            <div className="flex gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filter === option.value
                      ? "bg-[var(--primary)] text-white"
                      : "bg-white text-[var(--foreground)] border border-[var(--border)] hover:bg-black/5"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredClauses.length === 0 ? (
            <div className="p-6">
              <Empty text="No clauses assigned to you yet" />
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {filteredClauses.map((clause, index) => (
                <div key={`${clause.contractId}-${clause.sectionTitle}-${clause.clauseIndex}`} className="p-6 hover:bg-black/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{clause.contractTitle}</h3>
                        <PriorityBadge priority={clause.contractPriority} />
                        <StatusBadge assignedAt={clause.assignedAt} />
                      </div>
                      <p className="text-[var(--muted)] mb-3">{clause.contractDescription}</p>
                      
                      <div className="bg-white/50 border border-[var(--border)] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-[var(--muted)]">{clause.divisionName}</span>
                          <span className="text-sm text-[var(--muted)]">•</span>
                          <span className="text-sm text-[var(--muted)]">{clause.sectionTitle}</span>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-sm text-[var(--foreground)] leading-relaxed">{clause.clauseText}</p>
                            <div className="flex items-center gap-4 text-xs text-[var(--muted)] mt-2">
                              <span>Client: {clause.clientCompany || 'Not specified'}</span>
                              <span>Assigned: {new Date(clause.assignedAt).toLocaleDateString()}</span>
                              <span>Contract: {new Date(clause.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link
                        href={`/division/member/clause/${clause.contractId}/${clause.divisionId}/${encodeURIComponent(clause.sectionTitle)}/${clause.clauseIndex}`}
                        className="text-[var(--primary)] hover:underline text-sm font-medium"
                      >
                        Edit Clause →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
