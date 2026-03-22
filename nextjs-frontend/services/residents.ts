import { ApiResponse, Resident, Unit } from '@/types'
import { api } from './auth'

export const residentsService = {
  async getByEstate(estateId: string): Promise<Resident[]> {
    const response = await api.get<ApiResponse<Resident[]>>(`/api/admin/estates/${estateId}/occupants`)
    return response.data.data
  },

  async create(estateId: string, data: {
    name: string
    email?: string
    phone?: string
    unitId: string
  }): Promise<Resident> {
    const response = await api.post<ApiResponse<Resident>>(`/api/admin/estates/${estateId}/occupants`, {
      ...data,
      estateId,
    })
    return response.data.data
  },

  async update(id: string, data: Partial<Resident>): Promise<Resident> {
    const response = await api.patch<ApiResponse<Resident>>(`/api/admin/occupants/${id}`, data)
    return response.data.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/admin/occupants/${id}`)
  },
}

export const unitsService = {
  async getByEstate(estateId: string): Promise<Unit[]> {
    const response = await api.get<ApiResponse<Unit[]>>(`/api/admin/estates/${estateId}/units`)
    return response.data.data
  },

  async create(estateId: string, data: {
    block: string
    flat: string
  }): Promise<Unit> {
    const response = await api.post<ApiResponse<Unit>>(`/api/admin/estates/${estateId}/units`, {
      ...data,
      estateId,
    })
    return response.data.data
  },
}