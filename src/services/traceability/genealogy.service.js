import axios from "@/lib/axios";

const API_BASE = "/api/traceability/genealogy";

export default {
  async getLotGenealogy(lotId, params = {}) {
    const response = await axios.get(`${API_BASE}/lot/${lotId}`, { params });
    return response.data;
  },

  async getComponentLinking(componentId, params = {}) {
    const response = await axios.get(`${API_BASE}/component/${componentId}`, { params });
    return response.data;
  },

  async getSupplierTrace(supplierId, params = {}) {
    const response = await axios.get(`${API_BASE}/supplier/${supplierId}`, { params });
    return response.data;
  },

  async linkComponents(linkData) {
    const response = await axios.post(`${API_BASE}/link`, linkData);
    return response.data;
  },

  async unlinkComponents(unlinkData) {
    const response = await axios.post(`${API_BASE}/unlink`, unlinkData);
    return response.data;
  },

  async getGenealogyTree(lotId) {
    const response = await axios.get(`${API_BASE}/${lotId}/tree`);
    return response.data;
  },

  async getTraceabilityReport(params = {}) {
    const response = await axios.get(`${API_BASE}/report`, { params });
    return response.data;
  }
};