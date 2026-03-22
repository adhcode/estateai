'use client'

import api from '@/services/api'
import { Building2, Mail, Phone, Shield, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    role: 'SUPER_ADMIN' | 'ESTATE_ADMIN' | 'SECURITY'
    isActive: boolean
    createdAt: string
    estate?: {
        id: string
        name: string
    }
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ESTATE_ADMIN' | 'SECURITY'>('ALL')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await api.get('/auth/users')
            setUsers(response.data.data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return <Shield className="h-4 w-4 text-purple-600" />
            case 'ESTATE_ADMIN':
                return <Building2 className="h-4 w-4 text-blue-600" />
            case 'SECURITY':
                return <Shield className="h-4 w-4 text-green-600" />
            default:
                return <Users className="h-4 w-4 text-gray-600" />
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return 'bg-purple-100 text-purple-800'
            case 'ESTATE_ADMIN':
                return 'bg-blue-100 text-blue-800'
            case 'SECURITY':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const formatRole = (role: string) => {
        return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }

    const filteredUsers = users.filter(user =>
        filter === 'ALL' || user.role === filter
    )

    const roleStats = {
        total: users.length,
        superAdmin: users.filter(u => u.role === 'SUPER_ADMIN').length,
        estateAdmin: users.filter(u => u.role === 'ESTATE_ADMIN').length,
        security: users.filter(u => u.role === 'SECURITY').length,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
                <p className="text-gray-600">Manage all users across the platform</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Users</p>
                            <p className="text-xl font-bold text-gray-900">{roleStats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Shield className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Super Admins</p>
                            <p className="text-xl font-bold text-gray-900">{roleStats.superAdmin}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Estate Admins</p>
                            <p className="text-xl font-bold text-gray-900">{roleStats.estateAdmin}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Shield className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Security</p>
                            <p className="text-xl font-bold text-gray-900">{roleStats.security}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
                {['ALL', 'SUPER_ADMIN', 'ESTATE_ADMIN', 'SECURITY'].map((role) => (
                    <button
                        key={role}
                        onClick={() => setFilter(role as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === role
                                ? 'bg-black text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {role === 'ALL' ? 'All Users' : formatRole(role)}
                    </button>
                ))}
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl border border-gray-100">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-500">No users match the selected filter</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-gray-600">
                                                {user.firstName[0]}{user.lastName[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-3">
                                                <h3 className="font-semibold text-gray-900">
                                                    {user.firstName} {user.lastName}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                                    {formatRole(user.role)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{user.email}</span>
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{user.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {user.estate && (
                                                <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                                                    <Building2 className="h-3 w-3" />
                                                    <span>{user.estate.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-500">
                                            Joined {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}