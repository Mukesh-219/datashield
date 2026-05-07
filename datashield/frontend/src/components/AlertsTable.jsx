const AlertsTable = ({ alerts }) => {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyber-900/70 p-4">
      <h3 className="mb-4 text-lg font-semibold text-cyan-200">Recent Alerts</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-cyan-500/20 text-left text-slate-300">
              <th className="px-3 py-2">Attack Type</th>
              <th className="px-3 py-2">Severity</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">Endpoint</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-3 py-6 text-center text-slate-400">
                  No alerts found yet.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert._id} className="border-b border-cyan-500/10 text-slate-200">
                  <td className="px-3 py-2">{alert.attackType}</td>
                  <td className="px-3 py-2 capitalize">{alert.severity}</td>
                  <td className="px-3 py-2">{alert.riskScore}</td>
                  <td className="px-3 py-2">{alert.endpoint}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsTable;
