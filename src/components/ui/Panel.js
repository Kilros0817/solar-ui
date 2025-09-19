export default function Panel({ title, children }) {
  return (
    <div className="rounded border p-4 bg-white/60 space-y-3">
      <div className="font-medium">{title}</div>
      {children}
    </div>
  );
}
