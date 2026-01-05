import axios from "@/lib/axios";

const API_BASE = "/api/dashboard";

export default {
  async getOverview(params = {}) {
    const response = await axios.get(`${API_BASE}/overview`, { params });
    return response.data;
  },

  async getKPIs(params = {}) {
    const response = await axios.get(`${API_BASE}/kpis`, { params });
    return response.data;
  },

  async getMetrics(params = {}) {
    const response = await axios.get(`${API_BASE}/metrics`, { params });
    return response.data;
  },

  async getCharts(params = {}) {
    const response = await axios.get(`${API_BASE}/charts`, { params });
    return response.data;
  },

  async getAlerts(params = {}) {
    const response = await axios.get(`${API_BASE}/alerts`, { params });
    return response.data;
  },

  async getNotifications(params = {}) {
    const response = await axios.get(`${API_BASE}/notifications`, { params });
    return response.data;
  }
};