"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("sessionUser") || "null");
      setUser(stored);
    } catch {
      setUser(null);
    }
  }, [pathname]);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (pathname === "/login" || !user) return null;

  return (
    <header className="h-14 border-b border-[var(--border)] flex items-center justify-end px-4 bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="relative" ref={menuRef}>
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--foreground)] text-white flex items-center justify-center text-sm">{user.name?.[0] || "U"}</div>
          <div className="text-sm text-[var(--foreground)]">{user.name}</div>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[var(--border)] bg-white shadow-xl py-2 z-60">
            <div className="px-3 pb-2 text-xs text-[var(--muted)]">Signed in as</div>
            <div className="px-3 pb-2 text-sm text-[var(--foreground)]">{user.name}</div>
            <div className="h-px bg-[var(--border)] my-1" />
            <button
              onClick={() => {
                localStorage.removeItem("sessionUser");
                window.location.href = "/login";
              }}
              className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-black/5"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}


