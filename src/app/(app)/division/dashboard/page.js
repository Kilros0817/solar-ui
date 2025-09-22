"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Empty from "@/components/ui/Empty";
import { seedDeadlinesIfEmpty, getUpcomingDeadlines, seedActivitiesIfEmpty, getActivities } from "@/lib/activity";
import { seedContracts, seedMembers } from "@/lib/seedData";
import DeadlineItem from "@/components/dashboard/DeadlineItem";
import ActivityItem from "@/components/dashboard/ActivityItem";

export default function DivisionDashboardPage() {
  const [contracts, setContracts] = useState([]);
  const [user, setUser] = useState(null);
  const [deadlineLimit, setDeadlineLimit] = useState(5);
  const [activityLimit, setActivityLimit] = useState(6);

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
    seedDeadlinesIfEmpty();
    seedActivitiesIfEmpty();
  }, []);

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem("contracts") || "[]");
      console.log("All contracts:", all);
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
      setContracts(filteredContracts);
    } catch {
      setContracts([]);
    }
  }, [user]);

  const stats = useMemo(() => {
    const total = contracts.length;
    // For now, infer statuses from priority for demo
    const approved = contracts.filter((c) => c.priority === "Low").length;
    const pending = contracts.filter((c) => c.priority === "Medium").length;
    const requires = contracts.filter((c) => c.priority === "High" || c.priority === "Critical").length;
    
    return { total, approved, pending, requires };
  }, [contracts]);

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

  const recentActivity = useMemo(() => getActivities(activityLimit), [contracts, activityLimit]);
  const totalActivities = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("activities") || "[]").length || 0;
    } catch {
      return 0;
    }
  }, [activityLimit]);


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
          <h1 className="text-2xl font-semibold">Division Dashboard</h1>
          <p className="text-[var(--muted)] mt-1">
            {user.division ? `${user.division.charAt(0).toUpperCase() + user.division.slice(1)} Division` : 'No division assigned'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent><StatCard label="My Contracts" value={stats.total} color="bg-[var(--primary)]" /></CardContent></Card>
        <Card><CardContent><StatCard label="Approved" value={stats.approved} color="bg-green-500" /></CardContent></Card>
        <Card><CardContent><StatCard label="Pending Review" value={stats.pending} color="bg-amber-500" /></CardContent></Card>
        <Card><CardContent><StatCard label="Requires Action" value={stats.requires} color="bg-red-500" /></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <button 
                        onClick={() => setDeadlineLimit(5)}
                        className="px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      >
                        Show less
                      </button>
                    )}
                    {upcomingDeadlines.length < totalDeadlines && (
                      <button 
                        onClick={() => setDeadlineLimit((n) => n + 5)}
                        className="px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      >
                        View more deadlines
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

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
                      <button 
                        onClick={() => setActivityLimit(6)}
                        className="px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      >
                        Show less
                      </button>
                    )}
                    {recentActivity.length < totalActivities && (
                      <button 
                        onClick={() => setActivityLimit((n) => n + 6)}
                        className="px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      >
                        View more activity
                      </button>
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
