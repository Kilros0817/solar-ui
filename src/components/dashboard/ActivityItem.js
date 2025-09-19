import { FilePlus, Send, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";

export default function ActivityItem({ item }) {
  const { icon: Icon, color, bg } = iconByType(item.type);
  return (
    <li className="flex items-center justify-between gap-3 border border-[var(--border)] rounded-lg px-3 py-2 bg-white/80 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex items-center justify-center w-9 h-9 rounded-md ${bg}`}>
          <Icon size={20} className={color} />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-[var(--foreground)]">{item.action}</div>
          <div className="text-sm text-[var(--muted)] truncate">{item.contractTitle} · {item.client}</div>
          <div className="text-xs text-[var(--muted)]">{item.actor}</div>
        </div>
      </div>
      <span className="text-xs text-[var(--muted)] whitespace-nowrap">{timeAgo(item.at)}</span>
    </li>
  );
}

function iconByType(type) {
  switch (type) {
    case "created":
      return { icon: FilePlus, color: "text-blue-700", bg: "bg-blue-100" };
    case "submitted":
      return { icon: Send, color: "text-sky-700", bg: "bg-sky-100" };
    case "approved":
      return { icon: CheckCircle2, color: "text-green-700", bg: "bg-green-100" };
    case "requires_action":
      return { icon: AlertTriangle, color: "text-red-700", bg: "bg-red-100" };
    default:
      return { icon: MessageSquare, color: "text-amber-700", bg: "bg-amber-100" };
  }
}

function timeAgo(iso) {
  const delta = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (delta < 60) return `${delta}s ago`;
  const m = Math.floor(delta / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
