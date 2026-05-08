const toneBySeverity = {
  informational: "bg-slate-700/70 text-slate-200 border-slate-500/40",
  medium: "bg-yellow-500/20 text-yellow-200 border-yellow-400/40",
  high: "bg-orange-500/20 text-orange-200 border-orange-400/40",
  critical: "bg-red-500/20 text-red-200 border-red-400/40",
};

const SeverityBadge = ({ severity = "informational" }) => {
  const normalized = String(severity).toLowerCase();
  const classes = toneBySeverity[normalized] || toneBySeverity.informational;

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold capitalize ${classes}`}>
      {normalized}
    </span>
  );
};

export default SeverityBadge;
