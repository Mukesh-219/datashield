const StatCard = ({ label, value, tone = "cyan" }) => {
  const toneClasses = {
    cyan: "border-cyan-400/40 text-cyan-300",
    amber: "border-amber-400/40 text-amber-300",
    red: "border-red-400/40 text-red-300",
  };

  return (
    <div className={`rounded-xl border bg-cyber-900/70 p-5 ${toneClasses[tone]}`}>
      <p className="text-sm uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
};

export default StatCard;
