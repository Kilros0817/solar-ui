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
      { id: "u-legal-1", name: "Alice Legal", role: "legal" },
      { id: "u-legal-2", name: "Bob Legal", role: "legal" },
      { id: "u-leader-1", name: "Cara Leader", role: "leader" },
      { id: "u-member-1", name: "Dave Member", role: "member" },
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
    router.replace("/dashboard");
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
                    {u.name} ({u.role})
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


