import axios from "@/lib/axios";

const API_BASE = "/api/reports/inventory";

export default {
  async getStockReport(params = {}) {
    const response = await axios.get(`${API_BASE}/stock`, { params });
    return response.data;
  },

  async getMovementReport(params = {}) {
    const response = await axios.get(`${API_BASE}/movement`, { params });
    return response.data;
  },

  async getValuationReport(params = {}) {
    const response = await axios.get(`${API_BASE}/valuation`, { params });
    return response.data;
  },

  async getTurnoverReport(params = {}) {
    const response = await axios.get(`${API_BASE}/turnover`, { params });
    return response.data;
  },

  async getAgingReport(params = {}) {
    const response = await axios.get(`${API_BASE}/aging`, { params });
    return response.data;
  },

  async getLowStockReport(params = {}) {
    const response = await axios.get(`${API_BASE}/low-stock`, { params });
    return response.data;
  },

  async getExpiryReport(params = {}) {
    const response = await axios.get(`${API_BASE}/expiry`, { params });
    return response.data;
  }
};