export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl glass shadow-[0_6px_24px_rgba(0,0,0,0.06)] ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={`px-5 py-4 border-b border-[var(--border)] ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>;
}


