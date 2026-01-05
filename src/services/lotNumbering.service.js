import axios from "@/lib/axios";

const API_BASE = "/api/settings/lot-numbering";

export default {
  async getSettings() {
    const response = await axios.get(API_BASE);
    return response.data;
  },

  async updateSettings(settings) {
    const response = await axios.put(API_BASE, settings);
    return response.data;
  },

  async generateSampleNumbering(settings) {
    const response = await axios.post(`${API_BASE}/generate-sample`, settings);
    return response.data;
  },

  async validatePattern(pattern) {
    const response = await axios.post(`${API_BASE}/validate-pattern`, { pattern });
    return response.data;
  }
};