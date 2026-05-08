import { useCallback, useMemo, useState, useEffect } from "react";
import { io } from "socket.io-client";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import StatCard from "../components/StatCard";
import AlertsTable from "../components/AlertsTable";
import ScanForm from "../components/ScanForm";
import RecentScans from "../components/RecentScans";
import SeverityPieChart from "../components/SeverityPieChart";
import AttackBarChart from "../components/AttackBarChart";
import ScansLineChart from "../components/ScansLineChart";
import { getDashboardData } from "../services/dashboardService";

const SOCKET_URL = "http://localhost:5000";

const DashboardPage = () => {
  const [scans, setScans] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  const refreshDashboard = useCallback(async (isBackground = false) => {
    setError("");

    if (isBackground) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getDashboardData();
      setScans(data.scans);
      setAlerts(data.alerts);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("alert:created", (payload) => {
      const attackType = payload?.alert?.attackType || "Threat";
      setNotification(`New ${attackType} alert detected`);
      refreshDashboard(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [refreshDashboard]);

  useEffect(() => {
    if (!notification) return undefined;

    const timeout = setTimeout(() => {
      setNotification("");
    }, 3500);

    return () => clearTimeout(timeout);
  }, [notification]);

  const highSeverityCount = useMemo(
    () => alerts.filter((item) => item.severity === "high" || item.severity === "critical").length,
    [alerts]
  );

  const highestRiskScore = useMemo(
    () => alerts.reduce((max, item) => Math.max(max, Number(item.riskScore) || 0), 0),
    [alerts]
  );

  const recentAlerts = useMemo(() => alerts.slice(0, 5), [alerts]);
  const recentScans = useMemo(() => scans.slice(0, 8), [scans]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-cyan-300">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-cyber-950 text-slate-100 lg:flex">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8">
        <TopNavbar />

        {notification ? (
          <p className="mb-4 rounded-md border border-cyan-500/40 bg-cyber-800 p-3 text-cyan-200">{notification}</p>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-md border border-red-500/40 bg-red-950/40 p-3 text-red-300">{error}</p>
        ) : null}

        {refreshing ? <p className="mb-4 text-sm text-cyan-300">Refreshing dashboard data...</p> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Scans" value={scans.length} tone="cyan" />
          <StatCard label="Total Alerts" value={alerts.length} tone="amber" />
          <StatCard label="High Severity Alerts" value={highSeverityCount} tone="red" />
          <StatCard label="Highest Risk Score" value={highestRiskScore.toFixed(2)} tone="cyan" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <ScanForm onScanCreated={() => refreshDashboard(true)} />
          </div>
          <div className="xl:col-span-3">
            <RecentScans scans={recentScans} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-3">
          <SeverityPieChart alerts={alerts} />
          <AttackBarChart alerts={alerts} />
          <ScansLineChart scans={scans} />
        </section>

        <section className="mt-6">
          <AlertsTable alerts={recentAlerts} />
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
