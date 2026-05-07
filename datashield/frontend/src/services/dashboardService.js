import api from "./api";

export const getScans = async () => {
  const response = await api.get("/scans");
  return response.data;
};

export const getAlerts = async () => {
  const response = await api.get("/alerts");
  return response.data;
};
