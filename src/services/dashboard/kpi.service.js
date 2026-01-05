import axios from "@/lib/axios";

const API_BASE = "/api/dashboard/kpi";

export default {
  async getKPIs(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getKPIById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async updateKPI(id, kpiData) {
    const response = await axios.put(`${API_BASE}/${id}`, kpiData);
    return response.data;
  },

  async getKPIHistory(id, params = {}) {
    const response = await axios.get(`${API_BASE}/${id}/history`, { params });
    return response.data;
  },

  async getKPIReport(params = {}) {
    const response = await axios.get(`${API_BASE}/report`, { params });
    return response.data;
  }
};