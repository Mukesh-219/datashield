import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import StatCard from "../components/StatCard";
import AlertsTable from "../components/AlertsTable";
import { getAlerts, getScans } from "../services/dashboardService";

const DashboardPage = () => {
  const [scans, setScans] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const [scanData, alertData] = await Promise.all([getScans(), getAlerts()]);
        setScans(scanData.scans || []);
        setAlerts(alertData.alerts || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const highSeverityCount = useMemo(
    () => alerts.filter((item) => item.severity === "high" || item.severity === "critical").length,
    [alerts]
  );

  const recentAlerts = useMemo(() => alerts.slice(0, 5), [alerts]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-cyan-300">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-cyber-950 text-slate-100 lg:flex">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8">
        <TopNavbar />

        {error ? (
          <p className="mb-4 rounded-md border border-red-500/40 bg-red-950/40 p-3 text-red-300">{error}</p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total Scans" value={scans.length} tone="cyan" />
          <StatCard label="Total Alerts" value={alerts.length} tone="amber" />
          <StatCard label="High Severity Alerts" value={highSeverityCount} tone="red" />
        </section>

        <section className="mt-6">
          <AlertsTable alerts={recentAlerts} />
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
