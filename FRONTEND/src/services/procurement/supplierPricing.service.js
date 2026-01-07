import axios from "@/lib/axios";

const API_BASE = "/api/procurement/supplier-pricing";

export default {
  async getSupplierPriceList(supplierId, params = {}) {
    const response = await axios.get(`${API_BASE}/supplier/${supplierId}`, { params });
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

  async getPriceHistory(supplierId, partNumber, params = {}) {
    const response = await axios.get(`${API_BASE}/history/${supplierId}/${partNumber}`, { params });
    return response.data;
  },

  async getCostHistory(supplierId, params = {}) {
    const response = await axios.get(`${API_BASE}/cost-history/${supplierId}`, { params });
    return response.data;
  },

  async getLeadTimeMatrix(supplierId, params = {}) {
    const response = await axios.get(`${API_BASE}/lead-times/${supplierId}`, { params });
    return response.data;
  },

  async calculateSupplierQuote(quoteData) {
    const response = await axios.post(`${API_BASE}/calculate`, quoteData);
    return response.data;
  }
};