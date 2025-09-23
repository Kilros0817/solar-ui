"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");

  const users = useMemo(
    () => [
      { id: "u-legal-1", name: "Alice Legal", role: "Legal Team", division: null },
      { id: "u-legal-2", name: "Bob Legal", role: "Legal Team", division: null },
      { id: "u-leader-legal", name: "Cara Legal Leader", role: "Division Leader", division: "legal" },
      { id: "u-leader-finance", name: "David Finance Leader", role: "Division Leader", division: "finance" },
      { id: "u-leader-procurement", name: "Eva Procurement Leader", role: "Division Leader", division: "procurement" },
      { id: "u-leader-operations", name: "Frank Operations Leader", role: "Division Leader", division: "operations" },
      { id: "u-leader-compliance", name: "Grace Compliance Leader", role: "Division Leader", division: "compliance" },
      // Division Members
      { id: "member-1", name: "Sarah Johnson", role: "Senior Legal Associate", division: "legal" },
      { id: "member-2", name: "Michael Chen", role: "Legal Associate", division: "legal" },
      { id: "member-3", name: "Emily Rodriguez", role: "Legal Assistant", division: "legal" },
      { id: "member-4", name: "David Kim", role: "Procurement Specialist", division: "procurement" },
      { id: "member-5", name: "Lisa Thompson", role: "Senior Procurement Manager", division: "procurement" },
      { id: "member-6", name: "James Wilson", role: "Procurement Coordinator", division: "procurement" },
      { id: "member-7", name: "Anna Martinez", role: "Financial Analyst", division: "finance" },
      { id: "member-8", name: "Robert Taylor", role: "Senior Financial Manager", division: "finance" },
      { id: "member-9", name: "Jennifer Brown", role: "Operations Manager", division: "operations" },
      { id: "member-10", name: "Kevin Davis", role: "IT Operations Specialist", division: "operations" },
      { id: "member-11", name: "Amanda White", role: "Compliance Officer", division: "compliance" },
      { id: "member-12", name: "Christopher Lee", role: "Senior Compliance Analyst", division: "compliance" },
    ],
    []
  );

  useEffect(() => {
    const existing = localStorage.getItem("sessionUser");
    if (existing) {
      router.replace("/dashboard");
    }
  }, [router]);

  function handleLogin() {
    const user = users.find((u) => u.id === selectedUserId);
    if (!user) return;
    localStorage.setItem("sessionUser", JSON.stringify(user));
    
    // Route based on user role
    if (user.role === "Division Leader") {
      router.replace("/division/dashboard");
    } else if (user.role && user.role !== "Division Leader" && user.role !== "Legal Team") {
      router.replace("/division/member/dashboard");
    } else {
      router.replace("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.12),transparent_60%)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-gray-600">Select a user to continue</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 bg-white text-black"
              >
                <option value="">-- Choose --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role}{u.division ? ` - ${u.division}` : ''})
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleLogin} disabled={!selectedUserId} className="w-full">Login</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


