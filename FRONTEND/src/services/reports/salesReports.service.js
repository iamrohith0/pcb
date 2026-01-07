import axios from "@/lib/axios";

const API_BASE = "/api/reports/sales";

export default {
  async getSalesSummaryReport(params = {}) {
    const response = await axios.get(`${API_BASE}/summary`, { params });
    return response.data;
  },

  async getSalesByCustomerReport(params = {}) {
    const response = await axios.get(`${API_BASE}/by-customer`, { params });
    return response.data;
  },

  async getSalesByProductReport(params = {}) {
    const response = await axios.get(`${API_BASE}/by-product`, { params });
    return response.data;
  },

  async getSalesByRegionReport(params = {}) {
    const response = await axios.get(`${API_BASE}/by-region`, { params });
    return response.data;
  },

  async getSalesForecastReport(params = {}) {
    const response = await axios.get(`${API_BASE}/forecast`, { params });
    return response.data;
  },

  async getSalesPerformanceReport(params = {}) {
    const response = await axios.get(`${API_BASE}/performance`, { params });
    return response.data;
  },

  async getSalesTrendReport(params = {}) {
    const response = await axios.get(`${API_BASE}/trends`, { params });
    return response.data;
  }
};