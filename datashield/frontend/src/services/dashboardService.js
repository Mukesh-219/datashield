import api from "./api";

const severityCategories = ["informational", "medium", "high", "critical"];
const attackTypeCategories = ["SQLi", "XSS", "Suspicious", "Other"];

export const getScans = async () => {
  const response = await api.get("/scans");
  return response.data;
};

export const getAlerts = async () => {
  const response = await api.get("/alerts");
  return response.data;
};

export const getScanById = async (scanId) => {
  const response = await api.get(`/scans/${scanId}`);
  return response.data;
};

export const getAlertsByScan = async (scanId) => {
  const response = await api.get(`/alerts/scan/${scanId}`);
  return response.data;
};

export const getSeverityStats = (alerts = []) => {
  return severityCategories.map((severity) => ({
    name: severity,
    value: alerts.filter((item) => item.severity === severity).length,
  }));
};

export const getAttackTypeStats = (alerts = []) => {
  const counts = attackTypeCategories.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {});

  alerts.forEach((alert) => {
    const type = alert.attackType || "Other";
    if (counts[type] !== undefined) {
      counts[type] += 1;
    } else {
      counts.Other += 1;
    }
  });

  return attackTypeCategories.map((attackType) => ({
    attackType,
    count: counts[attackType],
  }));
};

export const getScanTrendStats = (scans = []) => {
  const today = new Date();
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const label = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return { date: label, count: 0 };
  });

  const grouped = scans.reduce((acc, scan) => {
    const dateKey = new Date(scan.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});

  return trend.map((point) => ({
    date: point.date,
    count: grouped[point.date] || 0,
  }));
};

export const getDashboardData = async () => {
  const [scanData, alertData] = await Promise.all([getScans(), getAlerts()]);

  const scans = scanData.scans || [];
  const alerts = alertData.alerts || [];

  return {
    scans,
    alerts,
    highestRiskScore: alerts.reduce((max, alert) => Math.max(max, Number(alert.riskScore) || 0), 0),
    recentAlerts: alerts.slice(0, 5),
    severityStats: getSeverityStats(alerts),
    attackTypeStats: getAttackTypeStats(alerts),
    scanTrendStats: getScanTrendStats(scans),
  };
};
