import Badge from "./Badge";

export default function PriorityBadge({ priority }) {
  const mapping = {
    Low: { variant: "green", label: "Approved" },
    Medium: { variant: "yellow", label: "Pending" },
    High: { variant: "red", label: "Requires Action" },
    Critical: { variant: "red", label: "Requires Action" },
  };
  const m = mapping[priority] || { variant: "default", label: priority };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
