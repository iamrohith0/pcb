import axios from "@/lib/axios";

const camJobsApi = {
  // List CAM jobs with filters
  async list(params = {}) {
    try {
      const response = await axios.get("/cam-jobs", { params });
      return response;
    } catch (error) {
      console.error("Error fetching CAM jobs:", error);
      throw error;
    }
  },

  // Get CAM job by ID
  async getById(id) {
    try {
      const response = await axios.get(`/cam-jobs/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM job ${id}:`, error);
      throw error;
    }
  },

  // Create new CAM job
  async create(data) {
    try {
      const response = await axios.post("/cam-jobs", data);
      return response;
    } catch (error) {
      console.error("Error creating CAM job:", error);
      throw error;
    }
  },

  // Update CAM job
  async update(id, data) {
    try {
      const response = await axios.put(`/cam-jobs/${id}`, data);
      return response;
    } catch (error) {
      console.error(`Error updating CAM job ${id}:`, error);
      throw error;
    }
  },

  // Delete CAM job (alias for delete)
  async remove(id) {
    return this.delete(id);
  },

  // Delete CAM job
  async delete(id) {
    try {
      const response = await axios.delete(`/cam-jobs/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting CAM job ${id}:`, error);
      throw error;
    }
  },

  // Update CAM job status
  async updateStatus(id, status) {
    try {
      const response = await axios.patch(`/cam-jobs/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error(`Error updating CAM job ${id} status:`, error);
      throw error;
    }
  },

  // Update CAM job priority
  async updatePriority(id, priority) {
    try {
      const response = await axios.patch(`/cam-jobs/${id}/priority`, { priority });
      return response;
    } catch (error) {
      console.error(`Error updating CAM job ${id} priority:`, error);
      throw error;
    }
  },

  // Get CAM jobs by status
  async getByStatus(status) {
    try {
      const response = await axios.get(`/cam-jobs/status/${status}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM jobs by status ${status}:`, error);
      throw error;
    }
  },

  // Get CAM jobs by customer
  async getByCustomer(customerId) {
    try {
      const response = await axios.get(`/cam-jobs/customer/${customerId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM jobs for customer ${customerId}:`, error);
      throw error;
    }
  },

  // Get CAM jobs by RFQ
  async getByRfq(rfqNo) {
    try {
      const response = await axios.get(`/cam-jobs/rfq/${rfqNo}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM jobs for RFQ ${rfqNo}:`, error);
      throw error;
    }
  },

  // Get CAM jobs by Sales Order
  async getBySalesOrder(salesOrderNo) {
    try {
      const response = await axios.get(`/cam-jobs/sales-order/${salesOrderNo}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM jobs for Sales Order ${salesOrderNo}:`, error);
      throw error;
    }
  },

  // Get CAM jobs by board name
  async getByBoardName(boardName) {
    try {
      const response = await axios.get(`/cam-jobs/board/${encodeURIComponent(boardName)}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM jobs for board ${boardName}:`, error);
      throw error;
    }
  },

  // Get CAM jobs by layer count
  async getByLayers(layerCount) {
    try {
      const response = await axios.get(`/cam-jobs/layers/${layerCount}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM jobs for ${layerCount} layers:`, error);
      throw error;
    }
  },

  // Get CAM jobs by priority
  async getByPriority(priority) {
    try {
      const response = await axios.get(`/cam-jobs/priority/${priority}`);
      return response;
    } catch (error) {
      console.error(`Error fetching CAM jobs with priority ${priority}:`, error);
      throw error;
    }
  },

  // Get CAM jobs due today
  async getDueToday() {
    try {
      const response = await axios.get("/cam-jobs/due/today");
      return response;
    } catch (error) {
      console.error("Error fetching CAM jobs due today:", error);
      throw error;
    }
  },

  // Get CAM jobs overdue
  async getOverdue() {
    try {
      const response = await axios.get("/cam-jobs/due/overdue");
      return response;
    } catch (error) {
      console.error("Error fetching overdue CAM jobs:", error);
      throw error;
    }
  },

  // Get CAM job statistics
  async getStats() {
    try {
      const response = await axios.get("/cam-jobs/stats");
      return response;
    } catch (error) {
      console.error("Error fetching CAM job statistics:", error);
      throw error;
    }
  },

  // Bulk update CAM jobs
  async bulkUpdate(ids, updates) {
    try {
      const response = await axios.patch("/cam-jobs/bulk", { ids, updates });
      return response;
    } catch (error) {
      console.error("Error bulk updating CAM jobs:", error);
      throw error;
    }
  },

  // Bulk delete CAM jobs
  async bulkDelete(ids) {
    try {
      const response = await axios.delete("/cam-jobs/bulk", { data: { ids } });
      return response;
    } catch (error) {
      console.error("Error bulk deleting CAM jobs:", error);
      throw error;
    }
  },
};

export default camJobsApi;