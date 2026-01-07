import axios from "@/lib/axios";

const camOutputsApi = {
  // Upload Gerber package
  async uploadGerber(formData) {
    try {
      const response = await axios.post("/cam-outputs/upload-gerber", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${progress}%`);
        },
      });
      return response;
    } catch (error) {
      console.error("Error uploading Gerber package:", error);
      throw error;
    }
  },

  // Get all CAM outputs (alias for getAll)
  async list(params = {}) {
    return this.getAll(params);
  },

  // Get all CAM outputs
  async getAll(params = {}) {
    try {
      const response = await axios.get("/cam-outputs", { params });
      return response;
    } catch (error) {
      console.error("Error fetching CAM outputs:", error);
      throw error;
    }
  },

  // Get CAM output by ID
  async getById(id) {
    try {
      const response = await axios.get(`/cam-outputs/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM output ${id}:`, error);
      throw error;
    }
  },

  // Update CAM output
  async update(id, data) {
    try {
      const response = await axios.put(`/cam-outputs/${id}`, data);
      return response;
    } catch (error) {
      console.error(`Error updating CAM output ${id}:`, error);
      throw error;
    }
  },

  // Delete CAM output
  async delete(id) {
    try {
      const response = await axios.delete(`/cam-outputs/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting CAM output ${id}:`, error);
      throw error;
    }
  },

  // Get CAM outputs by RFQ
  async getByRfq(rfqNo) {
    try {
      const response = await axios.get(`/cam-outputs/rfq/${rfqNo}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM outputs for RFQ ${rfqNo}:`, error);
      throw error;
    }
  },

  // Get CAM outputs by Sales Order
  async getBySalesOrder(salesOrderNo) {
    try {
      const response = await axios.get(`/cam-outputs/sales-order/${salesOrderNo}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM outputs for Sales Order ${salesOrderNo}:`, error);
      throw error;
    }
  },

  // Get CAM outputs by CAM number
  async getByCamNo(camNo) {
    try {
      const response = await axios.get(`/cam-outputs/cam/${camNo}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM outputs for CAM No ${camNo}:`, error);
      throw error;
    }
  },

  // Validate Gerber package
  async validatePackage(formData) {
    try {
      const response = await axios.post("/cam-outputs/validate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      console.error("Error validating Gerber package:", error);
      throw error;
    }
  },

  // Get download URL for CAM output
  async getDownloadUrl(id) {
    try {
      const response = await axios.get(`/cam-outputs/${id}/download-url`);
      return response;
    } catch (error) {
      console.error(`Error getting download URL for CAM output ${id}:`, error);
      throw error;
    }
  },

  // Get direct download URL (helper method)
  directDownloadUrl(id) {
    return `/api/cam-outputs/${id}/download`;
  },
};

export default camOutputsApi;