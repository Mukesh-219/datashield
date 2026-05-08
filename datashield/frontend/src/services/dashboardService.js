import api from "./api";

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

export const getDashboardData = async () => {
  const [scanData, alertData] = await Promise.all([getScans(), getAlerts()]);

  const scans = scanData.scans || [];
  const alerts = alertData.alerts || [];

  const highestRiskScore = alerts.reduce((max, alert) => Math.max(max, Number(alert.riskScore) || 0), 0);
  const recentAlerts = alerts.slice(0, 5);

  return {
    scans,
    alerts,
    highestRiskScore,
    recentAlerts,
  };
};
