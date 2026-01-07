import api from '../lib/axios';

// Dummy credentials for development/testing
const DUMMY_CREDENTIALS = {
  'admin@pcbxpress.com': {
    password: 'admin123',
    user: {
      id: 1,
      name: 'Admin User',
      email: 'admin@pcbxpress.com',
      role: 'admin',
      permissions: ['all']
    }
  },
  'user@pcbxpress.com': {
    password: 'user123',
    user: {
      id: 2,
      name: 'Regular User',
      email: 'user@pcbxpress.com',
      role: 'user',
      permissions: ['view_dashboard', 'view_inventory', 'view_orders']
    }
  }
};

const authService = {
  async login(credentials) {
    try {
      // Check if credentials match dummy users first
      const dummyUser = DUMMY_CREDENTIALS[credentials.email];
      if (dummyUser && dummyUser.password === credentials.password) {
        // Create a dummy token
        const dummyToken = 'dummy-jwt-token-' + Date.now();
        
        // Store token and user
        localStorage.setItem('token', dummyToken);
        localStorage.setItem('user', JSON.stringify(dummyUser.user));
        
        return { user: dummyUser.user };
      }
      
      // If not dummy credentials, try API call
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      return { user };
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;