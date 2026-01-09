import axios from "@/lib/axios";

const API_BASE = "/api/engineering/stackup";

const stackupApi = {
  async listTemplates(params = {}) {
    const response = await axios.get(`${API_BASE}/templates`, { params });
    return response.data;
  },

  async getTemplate(id) {
    const response = await axios.get(`${API_BASE}/templates/${id}`);
    return response.data;
  },

  async createTemplate(payload) {
    const response = await axios.post(`${API_BASE}/templates`, payload);
    return response.data;
  },

  async updateTemplate(id, payload) {
    const response = await axios.put(`${API_BASE}/templates/${id}`, payload);
    return response.data;
  },

  async deleteTemplate(id) {
    const response = await axios.delete(`${API_BASE}/templates/${id}`);
    return response.data;
  },

  async duplicateTemplate(id) {
    const response = await axios.post(`${API_BASE}/templates/${id}/duplicate`);
    return response.data;
  },

  async listMaterialRules(params = {}) {
    const response = await axios.get(`${API_BASE}/material-rules`, { params });
    return response.data;
  },

  async createMaterialRule(payload) {
    const response = await axios.post(`${API_BASE}/material-rules`, payload);
    return response.data;
  },

  async updateMaterialRule(id, payload) {
    const response = await axios.put(`${API_BASE}/material-rules/${id}`, payload);
    return response.data;
  },

  async deleteMaterialRule(id) {
    const response = await axios.delete(`${API_BASE}/material-rules/${id}`);
    return response.data;
  },
};

export default stackupApi;
