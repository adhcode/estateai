'use client'

import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { CheckCircle, Clock, Download, Eye, Search, User, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface VisitorCode {
    id: string
    code: string
    visitorName: string
    visitorPhone?: string
    purpose?: string
    status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED'
    createdAt: string
    expiresAt: string
    usedAt?: string
    occupant: {
        name: string
        unit: {
            block: string
            flat: string
        }
        primaryOccupant?: {
            name: string
            phone?: string
        }
    }
}

export default function VisitorHistoryPage() {
    const { user } = useAuth()
    const [visitorCodes, setVisitorCodes] = useState<VisitorCode[]>([])
    const [loading, setLoading] = useState(true)
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')

    useEffect(() => {
        if (user?.estate?.id) {
            loadVisitorHistory()
        }
    }, [user])

    const loadVisitorHistory = async () => {
        if (!user?.estate?.id) return

        try {
            setLoading(true)
            const response = await api.get(`/visitor-codes/estate/${user.estate.id}`)
            const data = response.data.success ? response.data.data : response.data
            setVisitorCodes(data || [])
        } catch (error) {
            console.error('Failed to load visitor history:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Active</span>
            case 'USED':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Used</span>
            case 'EXPIRED':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Expired</span>
            case 'REVOKED':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Revoked</span>
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Clock className="h-4 w-4 text-blue-600" />
            case 'USED':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'EXPIRED':
                return <XCircle className="h-4 w-4 text-red-600" />
            case 'REVOKED':
                return <XCircle className="h-4 w-4 text-gray-600" />
            default:
                return <Clock className="h-4 w-4 text-gray-600" />
        }
    }

    const filteredVisitorCodes = visitorCodes.filter(code => {
        const matchesSearch =
            code.visitorName.toLowerCase().includes(searchText.toLowerCase()) ||
            code.occupant.name.toLowerCase().includes(searchText.toLowerCase()) ||
            code.code.toLowerCase().includes(searchText.toLowerCase()) ||
            `${code.occupant.unit.block} ${code.occupant.unit.flat}`.toLowerCase().includes(searchText.toLowerCase())

        const matchesStatus = statusFilter === 'ALL' || code.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const stats = {
        total: visitorCodes.length,
        active: visitorCodes.filter(v => v.status === 'ACTIVE').length,
        used: visitorCodes.filter(v => v.status === 'USED').length,
        expired: visitorCodes.filter(v => v.status === 'EXPIRED').length,
        revoked: visitorCodes.filter(v => v.status === 'REVOKED').length,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visitor History</h1>
                    <p className="text-gray-600">Track all visitor codes and their usage for {user?.estate?.name}</p>
                </div>
                <button className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors">
                    <Download className="h-4 w-4" />
                    <span>Export Report</span>
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Codes</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Used</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.used}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Expired</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Revoked</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.revoked}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                            placeholder="Search visitors, hosts, units, or codes..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="USED">Used</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="REVOKED">Revoked</option>
                    </select>
                </div>
            </div>

            {/* Visitor History List */}
            {filteredVisitorCodes.length === 0 ? (
                <div className="text-center py-12">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No visitor codes found</h3>
                    <p className="text-gray-500">No visitor codes match your current filters</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">Visitor Code History</h3>
                        <p className="text-gray-600 text-sm">All visitor codes generated for this estate</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {filteredVisitorCodes.map((code) => (
                            <div key={code.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            {getStatusIcon(code.status)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{code.visitorName}</h3>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <div className="text-sm text-gray-500">
                                                    Code: <span className="font-mono font-medium">{code.code}</span>
                                                </div>
                                                {code.visitorPhone && (
                                                    <div className="text-sm text-gray-500">
                                                        Phone: {code.visitorPhone}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <div className="text-sm text-gray-500">
                                                    Host: {code.occupant.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Unit: {code.occupant.unit.block} - {code.occupant.unit.flat}
                                                </div>
                                                {code.purpose && (
                                                    <div className="text-sm text-gray-500">
                                                        Purpose: {code.purpose}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <div className="text-sm text-gray-500">
                                                Created: {new Date(code.createdAt).toLocaleDateString()} {new Date(code.createdAt).toLocaleTimeString()}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Expires: {new Date(code.expiresAt).toLocaleDateString()} {new Date(code.expiresAt).toLocaleTimeString()}
                                            </div>
                                            {code.usedAt && (
                                                <div className="text-sm text-gray-500">
                                                    Used: {new Date(code.usedAt).toLocaleDateString()} {new Date(code.usedAt).toLocaleTimeString()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </div>
                                        {getStatusBadge(code.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}