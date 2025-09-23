"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { seedContracts, seedMembers } from "@/lib/seedData";

export default function ClauseEditPage({ params }) {
  const { contractId, divisionId, sectionTitle, clauseIndex } = use(params);
  const [contract, setContract] = useState(null);
  const [user, setUser] = useState(null);
  const [clauseData, setClauseData] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
    if (!user || !contractId || !divisionId || !sectionTitle || clauseIndex === undefined) return;

    try {
      const allContracts = JSON.parse(localStorage.getItem("contracts") || "[]");
      const foundContract = allContracts.find(c => c.id === contractId);
      
      if (!foundContract) {
        setIsLoading(false);
        return;
      }

      // Find the specific clause - decode the section title
      const decodedSectionTitle = decodeURIComponent(sectionTitle);
      const division = foundContract.divisions?.find(div => div.id === divisionId);
      
      if (!division) {
        setIsLoading(false);
        return;
      }

      const section = division.sections?.find(sec => sec.title === decodedSectionTitle);
      
      if (!section || !section.clauses[parseInt(clauseIndex)]) {
        setIsLoading(false);
        return;
      }

      // Check if this clause is assigned to the current user
      const allocation = foundContract.clauseAllocations?.[divisionId]?.[decodedSectionTitle]?.find(
        a => a.clauseIndex === parseInt(clauseIndex) && a.assignedTo === user.id
      );

      if (!allocation) {
        setIsLoading(false);
        return;
      }

      setContract(foundContract);
      setClauseData({
        division: division,
        section: section,
        clause: section.clauses[parseInt(clauseIndex)],
        allocation: allocation
      });
      setEditedContent(section.clauses[parseInt(clauseIndex)]);
    } catch (error) {
      console.error("Error loading clause data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, contractId, divisionId, sectionTitle, clauseIndex]);

  function handleSave() {
    if (!contract || !clauseData) return;

    try {
      const allContracts = JSON.parse(localStorage.getItem("contracts") || "[]");
      const contractIndex = allContracts.findIndex(c => c.id === contract.id);
      
      if (contractIndex === -1) return;

      // Update the specific clause
      const updatedContract = { ...contract };
      const decodedSectionTitle = decodeURIComponent(sectionTitle);
      const divisionIndex = updatedContract.divisions.findIndex(div => div.id === divisionId);
      const sectionIndex = updatedContract.divisions[divisionIndex].sections.findIndex(sec => sec.title === decodedSectionTitle);
      
      updatedContract.divisions[divisionIndex].sections[sectionIndex].clauses[parseInt(clauseIndex)] = editedContent;

      allContracts[contractIndex] = updatedContract;
      localStorage.setItem("contracts", JSON.stringify(allContracts));
      
      setContract(updatedContract);
      setClauseData(prev => ({
        ...prev,
        clause: editedContent
      }));
      
      alert("Clause updated successfully!");
    } catch (error) {
      console.error("Error saving clause:", error);
      alert("Error saving clause. Please try again.");
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--muted)]">Loading clause...</h2>
        </div>
      </div>
    );
  }

  if (!contract || !clauseData) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <p>Clause not found or you don&apos;t have permission to edit this clause.</p>
        <Link className="text-[var(--primary)] hover:underline" href="/division/member/contracts">
          Back to My Clauses
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Clause</h1>
          <p className="text-[var(--muted)] mt-1">
            {contract.title} - {clauseData.division.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} size="sm">
            Save Changes
          </Button>
          <Link 
            href="/division/member/contracts"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Back to My Clauses
          </Link>
        </div>
      </div>

      {/* Contract Overview */}
      <Card>
        <CardHeader>
          <div className="font-medium">Contract Overview</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-[var(--border)] p-3 bg-white/80">
              <div className="text-xs text-[var(--muted)]">Contract</div>
              <div className="font-medium text-sm">{contract.title}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-white/80">
              <div className="text-xs text-[var(--muted)]">Priority</div>
              <div className="font-medium mt-1"><PriorityBadge priority={contract.priority} /></div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-white/80">
              <div className="text-xs text-[var(--muted)]">Status</div>
              <div className="font-medium mt-1"><StatusBadge assignedAt={clauseData.allocation.assignedAt} /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clause Details */}
      <Card>
        <CardHeader>
          <div className="font-medium">Clause Details</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-[var(--muted)] mb-1">Division</div>
              <div className="text-sm">{clauseData.division.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--muted)] mb-1">Section</div>
              <div className="text-sm">{clauseData.section.title}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--muted)] mb-2">Clause Content</div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-3 border border-[var(--border)] rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                rows={6}
                placeholder="Enter clause content..."
              />
            </div>
            <div className="text-xs text-[var(--muted)]">
              Assigned to you on {new Date(clauseData.allocation.assignedAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Link href="/division/member/contracts">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
