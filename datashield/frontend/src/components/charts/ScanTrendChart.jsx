import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ScanTrendChart = ({ data = [] }) => {
  const hasData = data.some((item) => item.count > 0);

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyber-900/70 p-4">
      <h3 className="mb-4 text-lg font-semibold text-cyan-200">Scan Trend (Last 7 Days)</h3>
      {!hasData ? (
        <p className="text-sm text-slate-400">No scan trend data available.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 12 }} />
              <YAxis stroke="#cbd5e1" allowDecimals={false} />
              <Tooltip formatter={(value) => [value, "Scans"]} />
              <Line type="monotone" dataKey="count" stroke="#67e8f9" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ScanTrendChart;
