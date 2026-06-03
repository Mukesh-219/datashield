import { useCallback, useMemo, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import StatCard from "../components/StatCard";
import AlertsTable from "../components/AlertsTable";
import ScanForm from "../components/ScanForm";
import RecentScans from "../components/RecentScans";
import SeverityPieChart from "../components/charts/SeverityPieChart";
import AttackTypeBarChart from "../components/charts/AttackTypeBarChart";
import ScanTrendChart from "../components/charts/ScanTrendChart";
import { getDashboardData } from "../services/dashboardService";
import { subscribeToEvent } from "../services/socketService";

const SOCKET_URL = "http://localhost:5000";

const DashboardPage = () => {
  const [scans, setScans] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [severityStats, setSeverityStats] = useState([]);
  const [attackTypeStats, setAttackTypeStats] = useState([]);
  const [scanTrendStats, setScanTrendStats] = useState([]);
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
      setSeverityStats(data.severityStats);
      setAttackTypeStats(data.attackTypeStats);
      setScanTrendStats(data.scanTrendStats);
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
    const handleAlertCreated = (payload) => {
      const attackType = payload?.alert?.attackType || "Attack";
      const severity = payload?.alert?.severity || "unknown";
      const riskScore = payload?.alert?.riskScore !== undefined ? Number(payload.alert.riskScore).toFixed(2) : "0.00";
      setNotification(`New ${attackType} alert • Severity: ${severity} • Risk: ${riskScore}`);
      refreshDashboard(true);
    };

    const handleScanCreated = (payload) => {
      const targetUrl = payload?.scan?.targetUrl || "unknown target";
      setNotification(`New scan created for ${targetUrl}`);
      refreshDashboard(true);
    };

    const unsubscribeAlert = subscribeToEvent("alertCreated", handleAlertCreated);
    const unsubscribeOldAlert = subscribeToEvent("alert:created", handleAlertCreated);
    const unsubscribeScan = subscribeToEvent("scanCreated", handleScanCreated);
    const unsubscribeOldScan = subscribeToEvent("scan:created", handleScanCreated);

    return () => {
      unsubscribeAlert();
      unsubscribeOldAlert();
      unsubscribeScan();
      unsubscribeOldScan();
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

        <section className="mt-6 rounded-3xl border border-cyan-500/20 bg-cyber-900/80 p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-100">Analytics</h2>
              <p className="text-sm text-slate-400">
                Visualize alert severity, attack frequency, and scan activity over the last 7 days.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <SeverityPieChart data={severityStats} />
            <AttackTypeBarChart data={attackTypeStats} />
            <ScanTrendChart data={scanTrendStats} />
          </div>
        </section>

        <section className="mt-6">
          <AlertsTable alerts={recentAlerts} />
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
