'use client'

import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Clock, Edit, Mail, Phone, Plus, Search, Shield, Trash2, UserCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SecurityStaff {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    role: 'SECURITY'
    isActive: boolean
    createdAt: string
    estate: {
        id: string
        name: string
    }
}

export default function SecurityStaffPage() {
    const { user } = useAuth()
    const [staff, setStaff] = useState<SecurityStaff[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newStaff, setNewStaff] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: ''
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user?.estate?.id) {
            loadSecurityStaff()
        }
    }, [user])

    const loadSecurityStaff = async () => {
        if (!user?.estate?.id) return

        try {
            setLoading(true)
            const response = await api.get(`/auth/estates/${user.estate.id}/users`)
            const data = response.data.success ? response.data.data : response.data
            // Filter only security users
            const securityStaff = (data || []).filter((u: any) => u.role === 'SECURITY')
            setStaff(securityStaff)
        } catch (error) {
            console.error('Failed to load security staff:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.estate?.id) return

        try {
            setSubmitting(true)
            const payload = {
                ...newStaff,
                estateId: user.estate.id
            }

            const response = await api.post('/auth/create-security', payload)

            setShowCreateForm(false)
            setNewStaff({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: ''
            })
            loadSecurityStaff()
        } catch (error) {
            console.error('Failed to create security staff:', error)
            alert('Failed to create security staff. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteStaff = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this security staff member?')) return

        try {
            await api.delete(`/auth/users/${id}`)
            loadSecurityStaff()
        } catch (error) {
            console.error('Failed to delete security staff:', error)
            alert('Failed to delete security staff. Please try again.')
        }
    }

    const filteredStaff = staff.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone && member.phone.includes(searchTerm))
    )

    const activeCount = staff.filter(s => s.isActive).length

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Security Staff</h1>
                    <p className="text-gray-600">Manage security personnel for {user?.estate?.name}</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Security Staff</span>
                </button>
            </div>

            {/* Create Form Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Security Staff</h2>
                        <p className="text-gray-600 mb-4">Create a new security account with login credentials</p>
                        <form onSubmit={handleCreateStaff} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.firstName}
                                    onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.lastName}
                                    onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter last name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={newStaff.email}
                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter email address"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This will be used for login access
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={newStaff.phone}
                                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="+1234567890"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Initial Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={newStaff.password}
                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter initial password"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Staff can change this after first login
                                </p>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Security Staff</p>
                            <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active Staff</p>
                            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Inactive Staff</p>
                            <p className="text-2xl font-bold text-gray-900">{staff.length - activeCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
            </div>

            {/* Staff List */}
            {filteredStaff.length === 0 ? (
                <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No security staff found</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first security staff member</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Add Security Staff
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <Shield className="h-5 w-5" />
                            <span>Security Personnel</span>
                        </h3>
                        <p className="text-gray-600 text-sm">All security staff members and their current status</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {filteredStaff.map((member) => (
                            <div key={member.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Shield className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {member.firstName} {member.lastName}
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{member.email}</span>
                                                </div>
                                                {member.phone && (
                                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{member.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Role: Security Staff
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-500">
                                            Added {new Date(member.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex space-x-1">
                                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStaff(member.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${member.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {member.isActive ? 'Active' : 'Inactive'}
                                        </span>
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