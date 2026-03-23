'use client'

import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Edit, Home, Mail, Phone, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Resident {
    id: string
    name: string
    email: string
    phone?: string
    createdAt: string
    isActive: boolean
    unit?: {
        id: string
        block: string
        flat: string
        floor: number
    }
}

export default function ResidentsPage() {
    const { user } = useAuth()
    const [residents, setResidents] = useState<Resident[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        unitId: ''
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user?.estate?.id) {
            fetchResidents()
            fetchUnits()
        }
    }, [user])

    const fetchUnits = async () => {
        if (!user?.estate?.id) return

        try {
            const response = await api.get(`/units/estate/${user.estate.id}/available`)
            const data = response.data.success ? response.data.data : response.data
            setUnits(data || [])
        } catch (error) {
            console.error('Error fetching units:', error)
        }
    }

    const fetchResidents = async () => {
        if (!user?.estate?.id) return

        try {
            setLoading(true)
            const response = await api.get(`/occupants?estateId=${user.estate.id}`)
            const data = response.data.success ? response.data.data : response.data
            setResidents(data || [])
        } catch (error) {
            console.error('Error fetching residents:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateResident = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.estate?.id) return

        try {
            setSubmitting(true)

            // Clean the payload - remove empty strings
            const payload: any = {
                name: formData.name,
                estateId: user.estate.id,
                unitId: formData.unitId,
                type: 'RESIDENT',
            }

            // Only add optional fields if they have values
            if (formData.email?.trim()) {
                payload.email = formData.email.trim()
            }
            if (formData.phone?.trim()) {
                payload.phone = formData.phone.trim()
            }

            const response = await api.post('/occupants', payload)

            setShowCreateForm(false)
            setFormData({ name: '', email: '', phone: '', unitId: '' })
            fetchResidents()
        } catch (error: any) {
            console.error('Error creating resident:', error)
            alert(error.response?.data?.message || 'Failed to create resident. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteResident = async (id: string) => {
        if (!confirm('Are you sure you want to remove this resident?')) return

        try {
            await api.delete(`/occupants/${id}`)
            fetchResidents()
        } catch (error) {
            console.error('Error deleting resident:', error)
            alert('Failed to delete resident. Please try again.')
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
                    <p className="text-gray-600">Manage residents in {user?.estate?.name}</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Resident</span>
                </button>
            </div>

            {/* Create Form Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Resident</h2>
                        <form onSubmit={handleCreateResident} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter full name"
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
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    WhatsApp Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="+1234567890"
                                />
                                <p className="text-xs text-blue-600 mt-1">
                                    📱 WhatsApp number required for visitor code notifications and AI assistant
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit *
                                </label>
                                <select
                                    required
                                    value={formData.unitId}
                                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                    <option value="">Select a unit</option>
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.block} - {unit.flat} {unit.floor ? `(Floor ${unit.floor})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {units.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        ⚠️ No available units found. Please create units first.
                                    </p>
                                )}
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
                                    {submitting ? 'Adding...' : 'Add Resident'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Residents List */}
            {residents.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No residents found</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first resident</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Add Resident
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100">
                    <div className="divide-y divide-gray-100">
                        {residents.map((resident) => (
                            <div key={resident.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{resident.name}</h3>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{resident.email}</span>
                                                </div>
                                                {resident.phone && (
                                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{resident.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {resident.unit && (
                                                <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                                                    <Home className="h-3 w-3" />
                                                    <span>{resident.unit.block} - {resident.unit.flat}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-500">
                                            Added {new Date(resident.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex space-x-1">
                                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteResident(resident.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${resident.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {resident.isActive ? 'Active' : 'Inactive'}
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