export default function TabButton({ active, children, ...props }) {
  return (
    <button
      className={
        "px-3 py-1.5 rounded-lg border " +
        (active ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "border-[var(--border)] text-[var(--foreground)] hover:bg-black/5")
      }
      {...props}
    >
      {children}
    </button>
  );
}
