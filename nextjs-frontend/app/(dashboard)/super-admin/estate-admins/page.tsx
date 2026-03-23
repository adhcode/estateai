'use client'

import api from '@/services/api'
import { Building2, Edit, Mail, Phone, Plus, Shield, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface EstateAdmin {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    role: string
    isActive: boolean
    createdAt: string
    estate?: {
        id: string
        name: string
    }
}

interface Estate {
    id: string
    name: string
}

export default function EstateAdminsPage() {
    const [admins, setAdmins] = useState<EstateAdmin[]>([])
    const [estates, setEstates] = useState<Estate[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        estateId: ''
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [usersRes, estatesRes] = await Promise.all([
                api.get('/auth/users'),
                api.get('/estates')
            ])

            // Filter only estate admins
            const allUsers = usersRes.data.data || []
            const estateAdmins = allUsers.filter((user: any) => user.role === 'ESTATE_ADMIN')
            setAdmins(estateAdmins)
            setEstates(estatesRes.data.data || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            await api.post('/auth/create-estate-admin', formData)
            setShowCreateForm(false)
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                estateId: ''
            })
            fetchData()
        } catch (error) {
            console.error('Error creating estate admin:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteAdmin = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this estate admin?')) return

        try {
            await api.delete(`/auth/users/${id}`)
            fetchData()
        } catch (error) {
            console.error('Error deleting estate admin:', error)
        }
    }

    const activeAdmins = admins.filter(admin => admin.isActive)
    const managedEstates = new Set(admins.map(admin => admin.estate?.id).filter(Boolean)).size

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
                    <h1 className="text-2xl font-bold text-gray-900">Estate Administrators</h1>
                    <p className="text-gray-600">Manage estate administrators across all properties</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Estate Admin</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Shield className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active Admins</p>
                            <p className="text-xl font-bold text-gray-900">{activeAdmins.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Managed Estates</p>
                            <p className="text-xl font-bold text-gray-900">{managedEstates}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Admins</p>
                            <p className="text-xl font-bold text-gray-900">{admins.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Form Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Estate Administrator</h2>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estate *
                                </label>
                                <select
                                    required
                                    value={formData.estateId}
                                    onChange={(e) => setFormData({ ...formData, estateId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                    <option value="">Select an estate</option>
                                    {estates.map((estate) => (
                                        <option key={estate.id} value={estate.id}>
                                            {estate.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Initial Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
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
                                    {submitting ? 'Creating...' : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admins List */}
            {admins.length === 0 ? (
                <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No estate administrators found</h3>
                    <p className="text-gray-500 mb-4">Get started by creating your first estate administrator</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Add Estate Admin
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100">
                    <div className="divide-y divide-gray-100">
                        {admins.map((admin) => (
                            <div key={admin.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Shield className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {admin.firstName} {admin.lastName}
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{admin.email}</span>
                                                </div>
                                                {admin.phone && (
                                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{admin.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {admin.estate && (
                                                <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                                                    <Building2 className="h-3 w-3" />
                                                    <span>{admin.estate.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-500">
                                            Created {new Date(admin.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex space-x-1">
                                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAdmin(admin.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${admin.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {admin.isActive ? 'Active' : 'Inactive'}
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