import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = {
  informational: "#94a3b8",
  medium: "#facc15",
  high: "#fb923c",
  critical: "#ef4444",
};

const SeverityPieChart = ({ alerts }) => {
  const distribution = ["informational", "medium", "high", "critical"].map((severity) => ({
    name: severity,
    value: alerts.filter((item) => item.severity === severity).length,
  }));

  const hasData = distribution.some((item) => item.value > 0);

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyber-900/70 p-4">
      <h3 className="mb-4 text-lg font-semibold text-cyan-200">Severity Distribution</h3>
      {!hasData ? (
        <p className="text-sm text-slate-400">No alert data available.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={distribution} dataKey="value" nameKey="name" outerRadius={100} label>
                {distribution.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SeverityPieChart;
