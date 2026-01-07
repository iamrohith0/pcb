import axios from "@/lib/axios";

const API_BASE = "/api/sales/pricing";

export default {
  async getPriceRules(params = {}) {
    const response = await axios.get(`${API_BASE}/rules`, { params });
    return response.data;
  },

  async createPriceRule(rule) {
    const response = await axios.post(`${API_BASE}/rules`, rule);
    return response.data;
  },

  async updatePriceRule(id, rule) {
    const response = await axios.put(`${API_BASE}/rules/${id}`, rule);
    return response.data;
  },

  async deletePriceRule(id) {
    const response = await axios.delete(`${API_BASE}/rules/${id}`);
    return response.data;
  },

  async getPriceHistory(productId, params = {}) {
    const response = await axios.get(`${API_BASE}/history/${productId}`, { params });
    return response.data;
  },

  async getLeadTimeMatrix(params = {}) {
    const response = await axios.get(`${API_BASE}/lead-times`, { params });
    return response.data;
  },

  async calculateQuote(quoteData) {
    const response = await axios.post(`${API_BASE}/calculate`, quoteData);
    return response.data;
  },

  async getCostHistory(productId, params = {}) {
    const response = await axios.get(`${API_BASE}/cost-history/${productId}`, { params });
    return response.data;
  }
};