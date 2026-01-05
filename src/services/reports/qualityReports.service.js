import axios from "@/lib/axios";

const API_BASE = "/api/reports/quality";

export default {
  async getFirstPassYieldReport(params = {}) {
    const response = await axios.get(`${API_BASE}/first-pass-yield`, { params });
    return response.data;
  },

  async getNCRTrendReport(params = {}) {
    const response = await axios.get(`${API_BASE}/ncr-trend`, { params });
    return response.data;
  },

  async getDefectReport(params = {}) {
    const response = await axios.get(`${API_BASE}/defects`, { params });
    return response.data;
  },

  async getInspectionReport(params = {}) {
    const response = await axios.get(`${API_BASE}/inspections`, { params });
    return response.data;
  },

  async getTestReport(params = {}) {
    const response = await axios.get(`${API_BASE}/tests`, { params });
    return response.data;
  },

  async getComplianceReport(params = {}) {
    const response = await axios.get(`${API_BASE}/compliance`, { params });
    return response.data;
  },

  async getQualitySummary(params = {}) {
    const response = await axios.get(`${API_BASE}/summary`, { params });
    return response.data;
  }
};