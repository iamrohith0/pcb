import axios from "@/lib/axios";

const API_BASE = "/api/engineering/cam";

export default {
  async getAll(params = {}) {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(camJob) {
    const response = await axios.post(API_BASE, camJob);
    return response.data;
  },

  async update(id, camJob) {
    const response = await axios.put(`${API_BASE}/${id}`, camJob);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async uploadGerber(gerberData) {
    const response = await axios.post(`${API_BASE}/upload-gerber`, gerberData);
    return response.data;
  },

  async getCamOutputs(jobId, params = {}) {
    const response = await axios.get(`${API_BASE}/${jobId}/outputs`, { params });
    return response.data;
  },

  async processCamJob(jobId) {
    const response = await axios.post(`${API_BASE}/${jobId}/process`);
    return response.data;
  }
};