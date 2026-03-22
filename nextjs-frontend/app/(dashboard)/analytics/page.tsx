'use client'

import api from '@/services/api'
import { BarChart3, Building2, Download, Filter, Shield, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AnalyticsData {
    totalEstates: number
    totalUsers: number
    totalEstateAdmins: number
    totalSecurity: number
    topEstates: Array<{
        id: string
        name: string
        adminCount: number
        createdAt: string
    }>
    recentActivity: Array<{
        id: string
        type: string
        message: string
        timestamp: string
    }>
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState('30d')

    useEffect(() => {
        loadAnalytics()
    }, [timeRange])

    const loadAnalytics = async () => {
        try {
            setLoading(true)

            const [estatesRes, usersRes] = await Promise.all([
                api.get('/estates'),
                api.get('/auth/users')
            ])

            const estates = estatesRes.data.data || []
            const users = usersRes.data.data || []

            // Calculate stats
            const estateAdmins = users.filter((user: any) => user.role === 'ESTATE_ADMIN')
            const securityUsers = users.filter((user: any) => user.role === 'SECURITY')

            // Build top estates with admin counts
            const topEstates = estates.map((estate: any) => ({
                id: estate.id,
                name: estate.name,
                adminCount: estateAdmins.filter((admin: any) => admin.estate?.id === estate.id).length,
                createdAt: estate.createdAt
            })).sort((a: any, b: any) => b.adminCount - a.adminCount).slice(0, 5)

            // Build recent activity from real data
            const recentActivity: any[] = []

            // Add recent estates
            estates
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3)
                .forEach((estate: any) => {
                    recentActivity.push({
                        id: `estate-${estate.id}`,
                        type: 'estate_created',
                        message: `New estate "${estate.name}" was added`,
                        timestamp: estate.createdAt
                    })
                })

            // Add recent users
            users
                .filter((user: any) => user.role !== 'SUPER_ADMIN')
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 4)
                .forEach((user: any) => {
                    recentActivity.push({
                        id: `user-${user.id}`,
                        type: 'user_created',
                        message: `${user.role.replace('_', ' ').toLowerCase()} ${user.firstName} ${user.lastName} was added`,
                        timestamp: user.createdAt
                    })
                })

            // Sort by timestamp
            recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

            setAnalytics({
                totalEstates: estates.length,
                totalUsers: users.length,
                totalEstateAdmins: estateAdmins.length,
                totalSecurity: securityUsers.length,
                topEstates,
                recentActivity: recentActivity.slice(0, 6)
            })
        } catch (error) {
            console.error('Failed to load analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

        if (diffInMinutes < 1) return 'Just now'
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
        return `${Math.floor(diffInMinutes / 1440)}d ago`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (!analytics) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Failed to load analytics data</p>
            </div>
        )
    }

    return (
        <div className="space-y-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
                    <p className="text-gray-600">Comprehensive insights across all estates</p>
                </div>
                <div className="flex items-center space-x-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                    <button className="flex items-center space-x-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        <Filter className="h-4 w-4" />
                        <span>Filter</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Estates</p>
                            <p className="text-3xl font-bold text-gray-900">{analytics.totalEstates}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900">{analytics.totalUsers}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Users className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Estate Admins</p>
                            <p className="text-3xl font-bold text-gray-900">{analytics.totalEstateAdmins}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Shield className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Security Staff</p>
                            <p className="text-3xl font-bold text-gray-900">{analytics.totalSecurity}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Shield className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Estates */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Top Estates</h2>
                        <TrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {analytics.topEstates.map((estate, index) => (
                            <div key={estate.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{estate.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {estate.adminCount} admin{estate.adminCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">
                                        Created {new Date(estate.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {analytics.topEstates.length === 0 && (
                            <div className="text-center py-8">
                                <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500">No estates found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                        <BarChart3 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {analytics.recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                        {analytics.recentActivity.length === 0 && (
                            <div className="text-center py-8">
                                <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">System Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">API Status</span>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Operational
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Database</span>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Healthy
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Authentication</span>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            Active
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Security</span>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Secure
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}