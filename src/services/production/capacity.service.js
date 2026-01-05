import axios from "@/lib/axios";

const API_BASE = "/api/production/capacity";

export default {
  async getCapacityOverview(params = {}) {
    const response = await axios.get(`${API_BASE}/overview`, { params });
    return response.data;
  },

  async getBottleneckAnalysis(params = {}) {
    const response = await axios.get(`${API_BASE}/bottlenecks`, { params });
    return response.data;
  },

  async getOEEData(params = {}) {
    const response = await axios.get(`${API_BASE}/oee`, { params });
    return response.data;
  },

  async getUtilizationReport(params = {}) {
    const response = await axios.get(`${API_BASE}/utilization`, { params });
    return response.data;
  },

  async getMachineCapacity(machineId, params = {}) {
    const response = await axios.get(`${API_BASE}/machine/${machineId}`, { params });
    return response.data;
  },

  async updateCapacitySettings(settings) {
    const response = await axios.put(`${API_BASE}/settings`, settings);
    return response.data;
  },

  async getCapacityForecast(params = {}) {
    const response = await axios.get(`${API_BASE}/forecast`, { params });
    return response.data;
  }
};