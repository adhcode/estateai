import api from './api'

// Re-export api for other services
export { api }

export interface LoginResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    role: 'SUPER_ADMIN' | 'ESTATE_ADMIN' | 'SECURITY'
    estate?: {
      id: string
      name: string
    }
  }
  access_token: string
}

export interface WrappedLoginResponse {
  success: boolean
  data: LoginResponse
  timestamp: string
  path: string
  method: string
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<WrappedLoginResponse>('/auth/login', { email, password })
    // Backend wraps response in { success, data } format
    return response.data.data
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error)
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },

  async getProfile() {
    const response = await api.get('/auth/profile')
    return response.data
  },

  async createEstateAdmin(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    estateId: string
  }) {
    const response = await api.post('/auth/create-estate-admin', data)
    return response.data
  },

  async createSecurity(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    estateId: string
  }) {
    const response = await api.post('/auth/create-security', data)
    return response.data
  },

  async getAllUsers() {
    const response = await api.get('/auth/users')
    return response.data
  },

  async getEstateUsers(estateId: string) {
    const response = await api.get(`/auth/estates/${estateId}/users`)
    return response.data
  },

  async updateUser(userId: string, data: {
    firstName?: string
    lastName?: string
    phone?: string
    email?: string
  }) {
    const response = await api.patch(`/auth/users/${userId}`, data)
    return response.data
  },

  async deactivateUser(userId: string) {
    const response = await api.delete(`/auth/users/${userId}`)
    return response.data
  },
}