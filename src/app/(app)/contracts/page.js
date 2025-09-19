"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PriorityBadge from "@/components/ui/PriorityBadge";
import TabButton from "@/components/ui/TabButton";
import { seedContractsIfEmpty } from "@/lib/activity";
import { Eye, Edit, Download, Building2, Calendar, DollarSign, FileText, Clock, Search, ChevronDown } from "lucide-react";

export default function ContractsIndex() {
  const [contracts, setContracts] = useState([]);
  const [tab, setTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("mostRecent");

  useEffect(() => {
    seedContractsIfEmpty();
    try {
      const all = JSON.parse(localStorage.getItem("contracts") || "[]");
      setContracts(all);
    } catch {
      setContracts([]);
    }
  }, []);

  const filtered = useMemo(() => {
    let result = contracts;
    
    // Apply tab filter
    if (tab === "approved") result = result.filter((c) => c.priority === "Low");
    else if (tab === "pending") result = result.filter((c) => c.priority === "Medium");
    else if (tab === "requires") result = result.filter((c) => c.priority === "High" || c.priority === "Critical");
    else if (tab === "archived") result = result.filter((c) => c.status === "archived");
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((c) => 
        c.title.toLowerCase().includes(query) ||
        c.client.toLowerCase().includes(query) ||
        (c.company && c.company.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "mostRecent":
          return new Date(b.modifiedAt || b.createdAt) - new Date(a.modifiedAt || a.createdAt);
        case "dueDate":
          return new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt);
        case "clientName":
          return a.client.localeCompare(b.client);
        case "contractPrice":
          return b.value - a.value;
        default:
          return 0;
      }
    });
    
    return result;
  }, [contracts, tab, searchQuery, sortBy]);

  const counts = useMemo(() => ({
    all: contracts.length,
    approved: contracts.filter((c) => c.priority === "Low").length,
    pending: contracts.filter((c) => c.priority === "Medium").length,
    requires: contracts.filter((c) => c.priority === "High" || c.priority === "Critical").length,
    archived: contracts.filter((c) => c.status === "archived").length,
  }), [contracts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contracts</h1>
        <Button asChild>
          <Link href="/contracts/new">Create Contract</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === "all"} onClick={() => setTab("all")}>All ({counts.all})</TabButton>
        <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>Pending ({counts.pending})</TabButton>
        <TabButton active={tab === "approved"} onClick={() => setTab("approved")}>Approved ({counts.approved})</TabButton>
        <TabButton active={tab === "requires"} onClick={() => setTab("requires")}>Requires Action ({counts.requires})</TabButton>
        <TabButton active={tab === "archived"} onClick={() => setTab("archived")}>Archived ({counts.archived})</TabButton>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
          >
            <option value="mostRecent">Most Recent</option>
            <option value="dueDate">Due Date</option>
            <option value="clientName">Client Name</option>
            <option value="contractPrice">Contract Price</option>
          </select>
          <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6 text-sm text-[var(--muted)]">
              {searchQuery.trim() ? `No contracts found matching "${searchQuery}"` : "No contracts yet."}
            </div>
          ) : (
            <div className="max-h-[650px] overflow-y-auto">
              <ul className="divide-y divide-[var(--border)]">
                {filtered.map((c) => (
                  <li key={c.id} className="py-4 px-6 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Link className="font-medium hover:underline text-[var(--foreground)]" href={`/contracts/${c.id}`}>
                          {c.title}
                        </Link>
                        <PriorityBadge priority={c.priority} />
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          c.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          c.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                          c.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {c.priority} Priority
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[var(--muted)]">
                        <div className="flex items-center gap-1">
                          <Building2 size={14} className="text-gray-500" />
                          <span className="font-medium">{c.client}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-500" />
                          <span className="font-medium">{new Date(c.dueDate || c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">${c.value.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[var(--muted)]">
                        <div className="flex items-center gap-1">
                          <FileText size={12} className="text-gray-500" />
                          <span>v{c.version || '1.0'}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-500" />
                          <span>{new Date(c.modifiedAt || c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View contract"
                      >
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit contract"
                      >
                        <Edit size={16} className="text-gray-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download contract"
                      >
                        <Download size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



