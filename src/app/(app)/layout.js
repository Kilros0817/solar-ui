"use client";

import Link from "next/link";
import { LayoutDashboard, FileText, Library, Building2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/templates", label: "Template Library", icon: Library },
  { href: "/clients", label: "Clients", icon: Building2 },
];

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("sessionUser") || "null");
      if (!stored) {
        router.replace("/login");
      } else {
        setUser(stored);
        // Redirect division leaders to their dashboard
        if (stored.role === "Division Leader" && !pathname.startsWith("/division")) {
          router.replace("/division/dashboard");
        }
      }
    } catch {
      router.replace("/login");
    }
  }, [router, pathname]);

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem("contracts") || "[]");
      // Filter contracts based on user role
      if (user?.role === "Division Leader") {
        const userDivision = user?.division;
        const filteredContracts = userDivision 
          ? all.filter(contract => 
              contract.assignedDivision === userDivision || 
              contract.divisions?.some(div => div.id === userDivision)
            )
          : [];
        setContracts(filteredContracts);
      } else {
        setContracts(all);
      }
    } catch {
      setContracts([]);
    }
  }, [pathname, user]);

  const counts = useMemo(() => {
    const all = contracts.length;
    return { all };
  }, [contracts]);

  function logout() {
    localStorage.removeItem("sessionUser");
    router.replace("/login");
  }

  if (!user) return null;

  // Division leader layout
  if (user.role === "Division Leader") {
    const divisionNavItems = [
      { href: "/division/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/division/contracts", label: "My Contracts", icon: FileText },
    ];

    return (
      <div className="flex">
        <aside className="w-[260px] border-r border-[var(--border)] bg-white/80 backdrop-blur p-5 flex flex-col gap-4" style={{ height: 'calc(100vh - 56px)' }}>
          <div className="px-2 py-1 text-xs uppercase tracking-wide text-gray-500">Division Leader</div>
          <nav className="flex-1 space-y-1">
            {divisionNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "block rounded-lg px-3 py-2 transition-colors " +
                  (pathname === item.href
                    ? "bg-[var(--foreground)]/5 text-[var(--foreground)]"
                    : "text-[var(--foreground)] hover:bg-black/5")
                }
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    {item.icon ? <item.icon size={18} /> : null}
                    <span>{item.label}</span>
                  </span>
                  {item.href === "/division/contracts" && (
                    <span className="text-xs text-[var(--muted)]">{counts.all}</span>
                  )}
                </span>
              </Link>
            ))}
          </nav>
          <div className="space-y-2">
            <div className="text-sm text-[var(--muted)]">{user.name} ({user.role})</div>
            <div className="text-xs text-[var(--muted)]">Division: {user.division || 'Not assigned'}</div>
            <button onClick={logout} className="w-full rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-black/5">Logout</button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-h-0" style={{ height: 'calc(100vh - 56px)' }}>
          <main className="p-6 flex-1 min-h-0 overflow-y-auto">{children}</main>
        </div>
      </div>
    );
  }

  // Legal team layout
  return (
    <div className="flex">
      <aside className="w-[260px] border-r border-[var(--border)] bg-white/80 backdrop-blur p-5 flex flex-col gap-4" style={{ height: 'calc(100vh - 56px)' }}>
        <div className="px-2 py-1 text-xs uppercase tracking-wide text-gray-500">Navigation</div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "block rounded-lg px-3 py-2 transition-colors " +
                (pathname === item.href
                  ? "bg-[var(--foreground)]/5 text-[var(--foreground)]"
                  : "text-[var(--foreground)] hover:bg-black/5")
              }
            >
              <span className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  {item.icon ? <item.icon size={18} /> : null}
                  <span>{item.label}</span>
                </span>
                {item.href === "/contracts" && (
                  <span className="text-xs text-[var(--muted)]">{counts.all}</span>
                )}
              </span>
            </Link>
          ))}
        </nav>
        <div className="space-y-2">
          <div className="text-sm text-[var(--muted)]">{user.name} ({user.role})</div>
          <button onClick={logout} className="w-full rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-black/5">Logout</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-0" style={{ height: 'calc(100vh - 56px)' }}>
        <main className="p-6 flex-1 min-h-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}


