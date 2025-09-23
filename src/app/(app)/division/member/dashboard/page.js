"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import { seedContracts, seedMembers } from "@/lib/seedData";

export default function DivisionMemberDashboard() {
  const [user, setUser] = useState(null);
  const [myClauses, setMyClauses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    recent: 0,
    overdue: 0
  });

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
                          contractPriority: contract.priority,
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
      
      // Calculate stats
      const now = new Date();
      const newClauses = assignedClauses.filter(clause => {
        const daysSinceAssigned = Math.floor((now - new Date(clause.assignedAt)) / (1000 * 60 * 60 * 24));
        return daysSinceAssigned <= 1;
      });
      
      const recentClauses = assignedClauses.filter(clause => {
        const daysSinceAssigned = Math.floor((now - new Date(clause.assignedAt)) / (1000 * 60 * 60 * 24));
        return daysSinceAssigned > 1 && daysSinceAssigned <= 3;
      });
      
      const overdueClauses = assignedClauses.filter(clause => {
        const daysSinceAssigned = Math.floor((now - new Date(clause.assignedAt)) / (1000 * 60 * 60 * 24));
        return daysSinceAssigned > 7;
      });
      
      setStats({
        total: assignedClauses.length,
        new: newClauses.length,
        recent: recentClauses.length,
        overdue: overdueClauses.length
      });
    } catch (error) {
      console.error("Error loading assigned clauses:", error);
      setMyClauses([]);
    }
  }, [user]);

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
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-[var(--muted)] mt-1">
          Welcome back, {user.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <StatCard
              label="Total Clauses"
              value={stats.total}
              color="bg-blue-300"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <StatCard
              label="New Clauses"
              value={stats.new}
              color="bg-green-300"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <StatCard
              label="Recent"
              value={stats.recent}
              color="bg-yellow-300"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <StatCard
              label="Overdue"
              value={stats.overdue}
              color="bg-red-300"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Clauses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="font-medium">Recent Assignments</div>
            <Link
              href="/division/member/contracts"
              className="text-[var(--primary)] hover:underline text-sm font-medium"
            >
              View All →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {myClauses.length === 0 ? (
            <div className="p-6">
              <div className="text-center text-[var(--muted)]">
                <p>No clauses assigned to you yet</p>
                <p className="text-sm mt-1">Check back later or contact your division leader</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {myClauses.slice(0, 5).map((clause, index) => (
                <div key={`${clause.contractId}-${clause.sectionTitle}-${clause.clauseIndex}`} className="p-4 hover:bg-black/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{clause.contractTitle}</h4>
                        <PriorityBadge priority={clause.contractPriority} />
                        <StatusBadge assignedAt={clause.assignedAt} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-2">
                        <span>{clause.divisionName}</span>
                        <span>•</span>
                        <span>{clause.sectionTitle}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-black rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm text-[var(--foreground)] leading-relaxed">{clause.clauseText}</p>
                          <Link
                            href={`/division/member/clause/${clause.contractId}/${clause.divisionId}/${encodeURIComponent(clause.sectionTitle)}/${clause.clauseIndex}`}
                            className="text-xs text-[var(--primary)] hover:underline mt-1 inline-block"
                          >
                            Edit Clause →
                          </Link>
                        </div>
                      </div>
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
