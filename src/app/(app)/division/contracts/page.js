"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Empty from "@/components/ui/Empty";
import Button from "@/components/ui/Button";
import { seedContracts, seedMembers } from "@/lib/seedData";

export default function DivisionContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [members, setMembers] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);

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
    try {
      const all = JSON.parse(localStorage.getItem("contracts") || "[]");
      const allMembers = JSON.parse(localStorage.getItem("divisionMembers") || "[]");
      
      console.log("All contracts:", all);
      console.log("All members:", allMembers);
      
      // Filter contracts for this division leader
      const userDivision = user?.division;
      console.log("User division:", userDivision);
      const filteredContracts = userDivision 
        ? all.filter(contract => 
            contract.assignedDivision === userDivision || 
            contract.divisions?.some(div => div.id === userDivision)
          )
        : [];
      
      console.log("Filtered contracts:", filteredContracts);
      
      // Filter members for this division
      const divisionMembers = userDivision 
        ? allMembers.filter(member => member.division === userDivision)
        : [];
      
      console.log("Division members:", divisionMembers);
      
      setContracts(filteredContracts);
      setMembers(divisionMembers);
    } catch {
      setContracts([]);
      setMembers([]);
    }
  }, [user]);

  const filteredContracts = useMemo(() => {
    if (filter === "all") return contracts;
    return contracts.filter(contract => contract.priority === filter);
  }, [contracts, filter]);

  const filterOptions = [
    { value: "all", label: "All Contracts" },
    { value: "Low", label: "Approved" },
    { value: "Medium", label: "Pending" },
    { value: "High", label: "Requires Action" },
    { value: "Critical", label: "Critical" },
  ];

  function handleAllocateClauses(contract) {
    setSelectedContract(contract);
    setShowAllocationModal(true);
  }

  function allocateClause(contractId, divisionId, sectionTitle, clauseIndex, memberId) {
    try {
      const allContracts = JSON.parse(localStorage.getItem("contracts") || "[]");
      const contractIndex = allContracts.findIndex(c => c.id === contractId);
      
      if (contractIndex === -1) return;
      
      const contract = allContracts[contractIndex];
      if (!contract.clauseAllocations) {
        contract.clauseAllocations = {};
      }
      if (!contract.clauseAllocations[divisionId]) {
        contract.clauseAllocations[divisionId] = {};
      }
      if (!contract.clauseAllocations[divisionId][sectionTitle]) {
        contract.clauseAllocations[divisionId][sectionTitle] = [];
      }
      
      // Find existing allocation or create new one
      const existingAllocation = contract.clauseAllocations[divisionId][sectionTitle].find(
        a => a.clauseIndex === clauseIndex
      );
      
      if (existingAllocation) {
        existingAllocation.assignedTo = memberId;
        existingAllocation.assignedAt = new Date().toISOString();
      } else {
        contract.clauseAllocations[divisionId][sectionTitle].push({
          clauseIndex,
          assignedTo: memberId,
          assignedAt: new Date().toISOString()
        });
      }
      
      allContracts[contractIndex] = contract;
      localStorage.setItem("contracts", JSON.stringify(allContracts));
      
      // Update local state
      setContracts(prev => prev.map(c => c.id === contractId ? contract : c));
    } catch (error) {
      console.error("Error allocating clause:", error);
    }
  }

  function getClauseAllocation(contract, divisionId, sectionTitle, clauseIndex) {
    if (!contract.clauseAllocations?.[divisionId]?.[sectionTitle]) return null;
    return contract.clauseAllocations[divisionId][sectionTitle].find(
      a => a.clauseIndex === clauseIndex
    );
  }

  function getMemberName(memberId) {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : "Unassigned";
  }

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
          <h1 className="text-2xl font-semibold">My Contracts</h1>
          <p className="text-[var(--muted)] mt-1">
            {user.division ? `${user.division.charAt(0).toUpperCase() + user.division.slice(1)} Division` : 'No division assigned'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="font-medium">Contract List</div>
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
          {filteredContracts.length === 0 ? (
            <div className="p-6">
              <Empty text="No contracts assigned to your division" />
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {filteredContracts.map((contract) => (
                <div key={contract.id} className="p-6 hover:bg-black/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{contract.title}</h3>
                        <PriorityBadge priority={contract.priority} />
                      </div>
                      <p className="text-[var(--muted)] mb-3">{contract.description}</p>
                      <div className="flex items-center gap-6 text-sm text-[var(--muted)]">
                        <span>Client: {contract.clientCompany || 'Not specified'}</span>
                        <span>Created: {new Date(contract.createdAt).toLocaleDateString()}</span>
                      </div>
                      {contract.divisions && contract.divisions.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-[var(--muted)] mb-1">Sections & Clauses:</div>
                          <div className="space-y-2">
                            {contract.divisions.map((div, idx) => (
                              <div key={idx} className="border border-[var(--border)] rounded-lg p-3 bg-white/50">
                                <div className="font-medium text-sm mb-2">{div.name}</div>
                                {div.sections.map((section, sectionIdx) => (
                                  <div key={sectionIdx} className="mb-3 last:mb-0">
                                    <div className="text-xs font-medium text-[var(--muted)] mb-1">{section.title}</div>
                                    <div className="space-y-1">
                                      {section.clauses.map((clause, clauseIdx) => {
                                        const allocation = getClauseAllocation(contract, div.id, section.title, clauseIdx);
                                        return (
                                          <div key={clauseIdx} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center flex-1 mr-2">
                                              <div className="w-2 h-2 bg-black rounded-full mr-3 flex-shrink-0"></div>
                                              <span className="text-[var(--muted)] truncate">{clause}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <select
                                                value={allocation?.assignedTo || ""}
                                                onChange={(e) => allocateClause(contract.id, div.id, section.title, clauseIdx, e.target.value)}
                                                className="text-xs border border-[var(--border)] rounded px-2 py-1 bg-white"
                                              >
                                                <option value="">Assign to...</option>
                                                {members.map(member => (
                                                  <option key={member.id} value={member.id}>
                                                    {member.name}
                                                  </option>
                                                ))}
                                              </select>
                                              {allocation && (
                                                <span className="text-xs text-[var(--primary)]">
                                                  {getMemberName(allocation.assignedTo)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="text-[var(--primary)] hover:underline text-sm font-medium"
                      >
                        View Details →
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
