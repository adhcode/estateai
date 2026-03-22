export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'ESTATE_ADMIN' | 'SECURITY'
  estate?: Estate
  createdAt: string
  updatedAt: string
}

export interface Estate {
  id: string
  name: string
  address: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Resident {
  id: string
  name: string
  email?: string
  phone?: string
  unit: Unit
  estateId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Unit {
  id: string
  block: string
  flat: string
  estateId: string
  createdAt: string
  updatedAt: string
}

export interface VisitorCode {
  id: string
  code: string
  visitorName: string
  visitorPhone?: string
  purpose?: string
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED'
  expiresAt: string
  createdAt: string
  whatsappSent?: boolean
  occupant?: Resident
  qrCodes?: {
    verification: string
    verificationSVG: string
    whatsappShare: string
    whatsappShareLink: string
    shareMessage: string
  }
}

export interface DashboardStats {
  totalEstates: number
  totalResidents: number
  totalVisitors: number
  activeVisitorCodes: number
  todayVisitors: number
  pendingApprovals: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}