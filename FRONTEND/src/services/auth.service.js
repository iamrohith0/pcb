import api from "../lib/axios";

const authService = {
  async login(credentials) {
    const response = await api.post("/api/auth/login", credentials);
    const { accessToken, user } = response.data;

    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    return { user };
  },

  async logout() {
    try {
      await api.post("/api/auth/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  async getCurrentUser() {
    const response = await api.get("/api/auth/me");
    return response.data;
  }
};

export default authService;

