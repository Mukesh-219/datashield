import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AttackBarChart = ({ alerts }) => {
  const frequencyMap = alerts.reduce((acc, alert) => {
    const key = alert.attackType || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(frequencyMap).map(([attackType, count]) => ({ attackType, count }));

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyber-900/70 p-4">
      <h3 className="mb-4 text-lg font-semibold text-cyan-200">Attack Type Frequency</h3>
      {chartData.length === 0 ? (
        <p className="text-sm text-slate-400">No attack data available.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="attackType" stroke="#cbd5e1" tick={{ fontSize: 12 }} />
              <YAxis stroke="#cbd5e1" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AttackBarChart;
