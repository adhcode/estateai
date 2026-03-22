'use client'

import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { CheckCircle, Clock, MapPin, RefreshCw, Search, User, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface VisitorCode {
    id: string
    code: string
    visitorName: string
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
    }
}

export default function VisitorLogPage() {
    const { user } = useAuth()
    const [visitorCodes, setVisitorCodes] = useState<VisitorCode[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')

    useEffect(() => {
        if (user?.estate?.id) {
            loadVisitorLog()
        }
    }, [user])

    const loadVisitorLog = async () => {
        if (!user?.estate?.id) return

        try {
            setLoading(true)
            const response = await api.get(`/visitor-codes/estate/${user.estate.id}`)
            const data = response.data.success ? response.data.data : response.data
            setVisitorCodes(data || [])
        } catch (error) {
            console.error('Failed to load visitor log:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-blue-100 text-blue-700'
            case 'USED':
                return 'bg-green-100 text-green-700'
            case 'EXPIRED':
                return 'bg-red-100 text-red-700'
            case 'REVOKED':
                return 'bg-slate-100 text-slate-700'
            default:
                return 'bg-slate-100 text-slate-700'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'USED':
                return <CheckCircle className="h-4 w-4" />
            case 'EXPIRED':
            case 'REVOKED':
                return <XCircle className="h-4 w-4" />
            default:
                return <Clock className="h-4 w-4" />
        }
    }

    const filteredEntries = visitorCodes.filter(code => {
        const matchesSearch =
            code.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            // Only allow searching by code for non-ACTIVE visitors (security measure)
            (code.status !== 'ACTIVE' && code.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
            code.occupant.name.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'ALL' || code.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const todayEntries = visitorCodes.filter(code => {
        const createdDate = new Date(code.createdAt).toDateString()
        const today = new Date().toDateString()
        return createdDate === today
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Visitor Log</h1>
                    <p className="text-slate-600">Track all visitor activity</p>
                </div>
                <button
                    onClick={loadVisitorLog}
                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <p className="text-2xl font-bold text-slate-900">{todayEntries.length}</p>
                    <p className="text-sm text-slate-600">Today</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <p className="text-2xl font-bold text-blue-600">
                        {todayEntries.filter(c => c.status === 'ACTIVE').length}
                    </p>
                    <p className="text-sm text-slate-600">Active</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <p className="text-2xl font-bold text-green-600">
                        {todayEntries.filter(c => c.status === 'USED').length}
                    </p>
                    <p className="text-sm text-slate-600">Used</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <p className="text-2xl font-bold text-slate-900">{visitorCodes.length}</p>
                    <p className="text-sm text-slate-600">Total</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            placeholder="Search visitor, code, or host..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="USED">Used</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="REVOKED">Revoked</option>
                    </select>
                </div>
            </div>

            {/* Visitor List */}
            {filteredEntries.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No visitors found</h3>
                    <p className="text-slate-500">No visitor codes match your search</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredEntries.map((code) => (
                        <div key={code.id} className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-semibold text-slate-900">{code.visitorName}</h3>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-lg flex items-center space-x-1 ${getStatusColor(code.status)}`}>
                                            {getStatusIcon(code.status)}
                                            <span>{code.status}</span>
                                        </span>
                                    </div>
                                    {/* Only show code for non-ACTIVE visitors (security measure) */}
                                    {code.status !== 'ACTIVE' && (
                                        <p className="text-sm text-slate-600 font-mono">Code: {code.code}</p>
                                    )}
                                    {code.status === 'ACTIVE' && (
                                        <p className="text-sm text-slate-500 italic">Code hidden until verified</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center space-x-2 text-slate-600">
                                    <User className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{code.occupant.name}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-slate-600">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span>{code.occupant.unit.block} - {code.occupant.unit.flat}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-slate-600">
                                    <Clock className="h-4 w-4 flex-shrink-0" />
                                    <span>{new Date(code.createdAt).toLocaleString()}</span>
                                </div>
                            </div>

                            {code.usedAt && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <div className="flex items-center space-x-2 text-sm text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Used at {new Date(code.usedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
