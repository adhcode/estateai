import api from './api'

export interface Estate {
  id: string
  name: string
  address: string
  phoneNumber?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    users: number
    units: number
    occupants: number
  }
}

export interface CreateEstateDto {
  name: string
  address: string
  phoneNumber?: string
  description?: string
  isActive?: boolean
}

export interface UpdateEstateDto {
  name?: string
  address?: string
  phoneNumber?: string
  description?: string
  isActive?: boolean
}

export interface EstateStats {
  totalUnits: number
  occupiedUnits: number
  totalOccupants: number
  totalVisitors: number
  activeVisitorCodes: number
  securityStaff: number
}

export const estatesService = {
  async getAll(): Promise<Estate[]> {
    const response = await api.get('/estates')
    return response.data
  },

  async getById(id: string): Promise<Estate> {
    const response = await api.get(`/estates/${id}`)
    return response.data
  },

  async getStats(id: string): Promise<EstateStats> {
    const response = await api.get(`/estates/${id}/stats`)
    return response.data
  },

  async create(estate: CreateEstateDto): Promise<Estate> {
    const response = await api.post('/estates', estate)
    return response.data
  },

  async update(id: string, estate: UpdateEstateDto): Promise<Estate> {
    const response = await api.patch(`/estates/${id}`, estate)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/estates/${id}`)
  },
}