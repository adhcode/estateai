import { ApiResponse, VisitorCode } from '@/types'
import { api } from './auth'

export const visitorsService = {
  async getByEstate(estateId: string): Promise<VisitorCode[]> {
    const response = await api.get<ApiResponse<VisitorCode[]>>(`/api/visitor-codes?estateId=${estateId}`)
    return response.data.data
  },

  async generate(data: {
    visitorName: string
    visitorPhone?: string
    purpose?: string
    occupantId: string
    estateId: string
    expiresAt: string
  }): Promise<VisitorCode> {
    const response = await api.post<ApiResponse<VisitorCode>>('/api/visitor-codes/generate', data)
    return response.data.data
  },

  async revoke(id: string): Promise<void> {
    await api.patch(`/api/visitor-codes/${id}/revoke`)
  },

  async verify(code: string): Promise<VisitorCode> {
    const response = await api.post<ApiResponse<VisitorCode>>('/api/visitor-codes/verify', { code })
    return response.data.data
  },
}