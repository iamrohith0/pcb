import axios from "@/lib/axios";

const API_BASE = "/api/reports/production";

export default {
  async getWorkOrderReport(params = {}) {
    const response = await axios.get(`${API_BASE}/work-orders`, { params });
    return response.data;
  },

  async getCapacityReport(params = {}) {
    const response = await axios.get(`${API_BASE}/capacity`, { params });
    return response.data;
  },

  async getOEEReport(params = {}) {
    const response = await axios.get(`${API_BASE}/oee`, { params });
    return response.data;
  },

  async getThroughputReport(params = {}) {
    const response = await axios.get(`${API_BASE}/throughput`, { params });
    return response.data;
  },

  async getDowntimeReport(params = {}) {
    const response = await axios.get(`${API_BASE}/downtime`, { params });
    return response.data;
  },

  async getQualityReport(params = {}) {
    const response = await axios.get(`${API_BASE}/quality`, { params });
    return response.data;
  },

  async getEfficiencyReport(params = {}) {
    const response = await axios.get(`${API_BASE}/efficiency`, { params });
    return response.data;
  }
};