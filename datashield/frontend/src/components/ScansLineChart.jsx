import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ScansLineChart = ({ scans }) => {
  const grouped = scans.reduce((acc, scan) => {
    const day = new Date(scan.createdAt).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyber-900/70 p-4">
      <h3 className="mb-4 text-lg font-semibold text-cyan-200">Scans Over Time</h3>
      {chartData.length === 0 ? (
        <p className="text-sm text-slate-400">No scan history available.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 12 }} />
              <YAxis stroke="#cbd5e1" allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#67e8f9" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ScansLineChart;
