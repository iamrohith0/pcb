import axios from "@/lib/axios";

const API_BASE = "/api/integrations/barcodes";

export default {
  async getSettings() {
    const response = await axios.get(API_BASE);
    return response.data;
  },

  async updateSettings(settings) {
    const response = await axios.put(API_BASE, settings);
    return response.data;
  },

  async generateBarcode(data) {
    const response = await axios.post(`${API_BASE}/generate`, data);
    return response.data;
  },

  async testConnection(settings) {
    const response = await axios.post(`${API_BASE}/test`, settings);
    return response.data;
  },

  async getSupportedFormats() {
    const response = await axios.get(`${API_BASE}/formats`);
    return response.data;
  }
};