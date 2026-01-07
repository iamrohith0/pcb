import axios from "@/lib/axios";

const API_BASE = "/api/plants";

export default {
  async getAll() {
    const response = await axios.get(API_BASE);
    return response.data;
  },

  async getById(id) {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  async create(plant) {
    const response = await axios.post(API_BASE, plant);
    return response.data;
  },

  async update(id, plant) {
    const response = await axios.put(`${API_BASE}/${id}`, plant);
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  async getShifts(plantId) {
    const response = await axios.get(`${API_BASE}/${plantId}/shifts`);
    return response.data;
  },

  async updateShifts(plantId, shifts) {
    const response = await axios.put(`${API_BASE}/${plantId}/shifts`, shifts);
    return response.data;
  }
};