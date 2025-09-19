export default function StatCard({ label, value, color = "bg-gray-300" }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-[var(--muted)]">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </div>
      <div className={`w-4 h-4 rounded-sm ${color}`} />
    </div>
  );
}
