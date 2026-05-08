import api from "./api";

export const createScan = async (payload) => {
  const response = await api.post("/scans", payload);
  return response.data;
};
