'use client'

import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Clock, Plus, QrCode, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DashboardStats {
    totalOccupants?: number
    activeVisitorCodes?: number
    todayVisitors?: number
    securityStaff?: number
}

export default function DashboardPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<DashboardStats>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [user])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            if (user?.role === 'ESTATE_ADMIN') {
                // Fetch estate-specific data
                const [occupantsRes] = await Promise.all([
                    api.get('/occupants').catch(() => ({ data: { data: [] } }))
                ])

                setStats({
                    totalOccupants: occupantsRes.data.data?.length || 0,
                    activeVisitorCodes: 0, // TODO: Implement when visitor codes endpoint is ready
                    todayVisitors: 0,
                    securityStaff: 0,
                })
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    // Estate Admin Dashboard
    if (user?.role === 'ESTATE_ADMIN') {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {getGreeting()}, {user?.firstName}
                    </h1>
                    <p className="text-slate-600">
                        {user.estate?.name || 'Your Estate'} Dashboard
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">Total Occupants</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.totalOccupants || 0}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <QrCode className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">Active Codes</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.activeVisitorCodes || 0}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">Today's Visitors</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.todayVisitors || 0}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            href="/admin/occupants"
                            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                    <Plus className="h-6 w-6 text-slate-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Add Occupant</p>
                                    <p className="text-sm text-slate-500">Register new resident</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/admin/visitors"
                            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                    <QrCode className="h-6 w-6 text-slate-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Generate Code</p>
                                    <p className="text-sm text-slate-500">Create visitor access</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/admin/visitor-history"
                            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                    <Clock className="h-6 w-6 text-slate-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">View History</p>
                                    <p className="text-sm text-slate-500">Past visitors</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/admin/security-staff"
                            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                    <Users className="h-6 w-6 text-slate-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Security Staff</p>
                                    <p className="text-sm text-slate-500">Manage personnel</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
                    </div>
                    <div className="text-center py-8 text-slate-500">
                        <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p>No recent activity</p>
                    </div>
                </div>
            </div>
        )
    }

    // Security Dashboard
    if (user?.role === 'SECURITY') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {getGreeting()}, {user?.firstName}
                    </h1>
                    <p className="text-slate-600">Security Dashboard</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link
                        href="/security/verification"
                        className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                    >
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                            <QrCode className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Verify Visitor</h3>
                        <p className="text-slate-600">Scan and verify visitor codes</p>
                    </Link>

                    <Link
                        href="/security/visitor-log"
                        className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                    >
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                            <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Visitor Log</h3>
                        <p className="text-slate-600">View all visitor entries</p>
                    </Link>
                </div>
            </div>
        )
    }

    // Default/Super Admin Dashboard
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {getGreeting()}, {user?.firstName}
                </h1>
                <p className="text-slate-600">Welcome to Kira</p>
            </div>
        </div>
    )
}
