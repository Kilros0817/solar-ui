"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { seedActivitiesIfEmpty, getActivities, seedDeadlinesIfEmpty, getUpcomingDeadlines } from "@/lib/activity";
import { seedContracts, seedMembers } from "@/lib/seedData";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Panel from "@/components/ui/Panel";
import Empty from "@/components/ui/Empty";
import ActivityItem from "@/components/dashboard/ActivityItem";
import DeadlineItem from "@/components/dashboard/DeadlineItem";

export default function DashboardPage() {
  const [contracts, setContracts] = useState([]);
  const [activityLimit, setActivityLimit] = useState(6);
  const [deadlineLimit, setDeadlineLimit] = useState(5);

  useEffect(() => {
    // Seed dummy data
    seedContracts();
    seedMembers();
    
    try {
      const all = JSON.parse(localStorage.getItem("contracts") || "[]");
      setContracts(all);
    } catch {
      setContracts([]);
    }
    seedActivitiesIfEmpty();
    seedDeadlinesIfEmpty();
  }, []);

  const stats = useMemo(() => {
    const total = contracts.length;
    // For now, infer statuses from priority for demo
    const approved = contracts.filter((c) => c.priority === "Low").length;
    const pending = contracts.filter((c) => c.priority === "Medium").length;
    const requires = contracts.filter((c) => c.priority === "High" || c.priority === "Critical").length;
    return { total, approved, pending, requires };
  }, [contracts]);

  const recentActivity = useMemo(() => getActivities(activityLimit), [contracts, activityLimit]);

  const totalActivities = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("activities") || "[]").length || 0;
    } catch {
      return 0;
    }
  }, [activityLimit]);

  const upcomingDeadlines = useMemo(() => getUpcomingDeadlines(deadlineLimit), [deadlineLimit]);
  const totalDeadlines = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("deadlines") || "[]");
      const now = new Date();
      return raw.filter(deadline => new Date(deadline.dueDate) > now).length;
    } catch {
      return 0;
    }
  }, [deadlineLimit]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button asChild>
          <Link href="/templates">Create Contract</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent><StatCard label="Total" value={stats.total} color="bg-[var(--primary)]" /></CardContent></Card>
        <Card><CardContent><StatCard label="Approved" value={stats.approved} color="bg-green-500" /></CardContent></Card>
        <Card><CardContent><StatCard label="Pending Review" value={stats.pending} color="bg-amber-500" /></CardContent></Card>
        <Card><CardContent><StatCard label="Requires Action" value={stats.requires} color="bg-red-500" /></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="font-medium">Recent Activity</div>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivity.length === 0 ? (
              <div className="p-6">
                <Empty text="No recent activity" />
              </div>
            ) : (
              <>
                <div className={`${recentActivity.length > 8 ? 'max-h-96 overflow-y-auto' : ''} p-6 pb-0`}>
                  <ul className="space-y-2">
                    {recentActivity.map((a) => (
                      <ActivityItem key={a.id} item={a} />
                    ))}
                  </ul>
                </div>
                {(recentActivity.length < totalActivities || activityLimit > 6) && (
                  <div className="p-6 pt-3 flex justify-end gap-2">
                    {activityLimit > 6 && (
                      <Button variant="subtle" onClick={() => setActivityLimit(6)}>
                        Show less
                      </Button>
                    )}
                    {recentActivity.length < totalActivities && (
                      <Button variant="subtle" onClick={() => setActivityLimit((n) => n + 6)}>
                        View more activity
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="font-medium">Upcoming Deadlines</div>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingDeadlines.length === 0 ? (
              <div className="p-6">
                <Empty text="No upcoming deadlines" />
              </div>
            ) : (
              <>
                <div className={`${upcomingDeadlines.length > 5 ? 'max-h-96 overflow-y-auto' : ''} p-6 pb-0`}>
                  <ul className="space-y-2">
                    {upcomingDeadlines.map((d) => (
                      <DeadlineItem key={d.id} deadline={d} />
                    ))}
                  </ul>
                </div>
                {(upcomingDeadlines.length < totalDeadlines || deadlineLimit > 5) && (
                  <div className="p-6 pt-3 flex justify-end gap-2">
                    {deadlineLimit > 5 && (
                      <Button variant="subtle" onClick={() => setDeadlineLimit(5)}>
                        Show less
                      </Button>
                    )}
                    {upcomingDeadlines.length < totalDeadlines && (
                      <Button variant="subtle" onClick={() => setDeadlineLimit((n) => n + 5)}>
                        View more deadlines
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



