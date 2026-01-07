import axios from "@/lib/axios";

const API_BASE = "/api/reports/finance";

export default {
  async getSalesReport(params = {}) {
    const response = await axios.get(`${API_BASE}/sales`, { params });
    return response.data;
  },

  async getPurchaseReport(params = {}) {
    const response = await axios.get(`${API_BASE}/purchases`, { params });
    return response.data;
  },

  async getInventoryReport(params = {}) {
    const response = await axios.get(`${API_BASE}/inventory`, { params });
    return response.data;
  },

  async getProfitLossReport(params = {}) {
    const response = await axios.get(`${API_BASE}/profit-loss`, { params });
    return response.data;
  },

  async getBalanceSheet(params = {}) {
    const response = await axios.get(`${API_BASE}/balance-sheet`, { params });
    return response.data;
  },

  async getCashFlowReport(params = {}) {
    const response = await axios.get(`${API_BASE}/cash-flow`, { params });
    return response.data;
  },

  async getFinancialSummary(params = {}) {
    const response = await axios.get(`${API_BASE}/summary`, { params });
    return response.data;
  }
};