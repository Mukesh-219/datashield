import { Link } from "react-router-dom";

const statusTone = {
  queued: "text-slate-300",
  running: "text-cyan-300",
  completed: "text-emerald-300",
  failed: "text-red-300",
};

const RecentScans = ({ scans }) => {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyber-900/70 p-4">
      <h3 className="mb-4 text-lg font-semibold text-cyan-200">Recent Scans</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-cyan-500/20 text-left text-slate-300">
              <th className="px-3 py-2">Target URL</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Alerts</th>
              <th className="px-3 py-2">Max Risk</th>
            </tr>
          </thead>
          <tbody>
            {scans.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-3 py-6 text-center text-slate-400">
                  No scans submitted yet.
                </td>
              </tr>
            ) : (
              scans.map((scan) => (
                <tr key={scan._id} className="border-b border-cyan-500/10 text-slate-200 hover:bg-cyber-800/40">
                  <td className="max-w-xs truncate px-3 py-2" title={scan.targetUrl}>
                    <Link to={`/dashboard/scans/${scan._id}`} className="text-cyan-300 hover:text-cyan-200">
                      {scan.targetUrl}
                    </Link>
                  </td>
                  <td className={`px-3 py-2 capitalize ${statusTone[scan.status] || "text-slate-300"}`}>
                    {scan.status}
                  </td>
                  <td className="px-3 py-2">{scan.alertCount}</td>
                  <td className="px-3 py-2">{Number(scan.maxRiskScore || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentScans;
