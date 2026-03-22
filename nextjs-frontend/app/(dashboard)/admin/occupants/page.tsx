'use client'

import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { ChevronDown, ChevronRight, Edit, Home, Mail, Phone, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Occupant {
    id: string
    name: string
    email?: string
    phone?: string
    type: 'RESIDENT' | 'HOUSEHOLD_MEMBER'
    isActive: boolean
    createdAt: string
    estate: {
        id: string
        name: string
    }
    unit: {
        id: string
        block: string
        flat: string
        floor?: number
    }
    primaryOccupant?: {
        id: string
        name: string
        phone?: string
        email?: string
    }
    householdMembers?: Occupant[]
}

export default function OccupantsPage() {
    const { user } = useAuth()
    const [occupants, setOccupants] = useState<Occupant[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [expandedResidents, setExpandedResidents] = useState<Set<string>>(new Set())
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        unitId: '',
        type: 'RESIDENT' as 'RESIDENT' | 'HOUSEHOLD_MEMBER',
        primaryOccupantId: ''
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user?.estate?.id) {
            fetchOccupants()
            fetchUnits()
        }
    }, [user])

    const fetchOccupants = async () => {
        if (!user?.estate?.id) return

        try {
            setLoading(true)
            const response = await api.get(`/occupants?estateId=${user.estate.id}`)
            const data = response.data.success ? response.data.data : response.data
            setOccupants(data || [])
        } catch (error) {
            console.error('Error fetching occupants:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUnits = async () => {
        if (!user?.estate?.id) return

        try {
            const response = await api.get(`/units/estate/${user.estate.id}`)
            const data = response.data.success ? response.data.data : response.data
            setUnits(data || [])
        } catch (error) {
            console.error('Error fetching units:', error)
        }
    }

    const handleCreateOccupant = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.estate?.id) return

        try {
            setSubmitting(true)

            // Clean the payload - remove empty strings
            const payload: any = {
                name: formData.name,
                estateId: user.estate.id,
                unitId: formData.unitId,
                type: formData.type,
            }

            // Only add optional fields if they have values
            if (formData.email?.trim()) {
                payload.email = formData.email.trim()
            }
            if (formData.phone?.trim()) {
                payload.phone = formData.phone.trim()
            }
            if (formData.primaryOccupantId?.trim()) {
                payload.primaryOccupantId = formData.primaryOccupantId.trim()
            }

            await api.post('/occupants', payload)

            setShowCreateForm(false)
            setFormData({ name: '', email: '', phone: '', unitId: '', type: 'RESIDENT', primaryOccupantId: '' })
            fetchOccupants()
        } catch (error: any) {
            console.error('Error creating occupant:', error)
            alert(error.response?.data?.message || 'Failed to create occupant. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteOccupant = async (id: string) => {
        if (!confirm('Are you sure you want to remove this occupant?')) return

        try {
            await api.delete(`/occupants/${id}`)
            fetchOccupants()
        } catch (error) {
            console.error('Error deleting occupant:', error)
            alert('Failed to delete occupant. Please try again.')
        }
    }

    const toggleResident = (residentId: string) => {
        const newExpanded = new Set(expandedResidents)
        if (newExpanded.has(residentId)) {
            newExpanded.delete(residentId)
        } else {
            newExpanded.add(residentId)
        }
        setExpandedResidents(newExpanded)
    }

    const residents = occupants.filter(o => o.type === 'RESIDENT')
    const householdMembers = occupants.filter(o => o.type === 'HOUSEHOLD_MEMBER')

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Occupants</h1>
                    <p className="text-slate-600 mt-1">Manage residents and household members</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center space-x-2 bg-black text-white px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Occupant</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Home className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Primary Residents</p>
                    <p className="text-3xl font-bold text-slate-900">{residents.length}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Household Members</p>
                    <p className="text-3xl font-bold text-slate-900">{householdMembers.length}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Users className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Total Occupants</p>
                    <p className="text-3xl font-bold text-slate-900">{occupants.length}</p>
                </div>
            </div>

            {/* Create Form Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Occupant</h2>
                        <form onSubmit={handleCreateOccupant} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    WhatsApp Phone Number
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="+1234567890"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Required for visitor code notifications
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Type
                                </label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'RESIDENT' | 'HOUSEHOLD_MEMBER' })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                    <option value="RESIDENT">Primary Resident</option>
                                    <option value="HOUSEHOLD_MEMBER">Household Member</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Unit
                                </label>
                                <select
                                    required
                                    value={formData.unitId}
                                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                    <option value="">Select a unit</option>
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.block} - {unit.flat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {formData.type === 'HOUSEHOLD_MEMBER' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Primary Resident
                                    </label>
                                    <select
                                        required
                                        value={formData.primaryOccupantId}
                                        onChange={(e) => setFormData({ ...formData, primaryOccupantId: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    >
                                        <option value="">Select primary resident</option>
                                        {residents.filter(r => r.unit.id === formData.unitId).map((resident) => (
                                            <option key={resident.id} value={resident.id}>
                                                {resident.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Adding...' : 'Add Occupant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Occupants List */}
            {occupants.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No occupants yet</h3>
                    <p className="text-slate-500 mb-6">Get started by adding your first occupant</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-black text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        Add Occupant
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200">
                    <div className="divide-y divide-slate-200">
                        {residents.map((resident) => {
                            const members = occupants.filter(o => o.primaryOccupant?.id === resident.id)
                            const isExpanded = expandedResidents.has(resident.id)

                            return (
                                <div key={resident.id}>
                                    {/* Primary Resident */}
                                    <div className="p-6 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4 flex-1">
                                                {members.length > 0 && (
                                                    <button
                                                        onClick={() => toggleResident(resident.id)}
                                                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 text-slate-600" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-slate-600" />
                                                        )}
                                                    </button>
                                                )}
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Home className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold text-slate-900">{resident.name}</h3>
                                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                            Primary
                                                        </span>
                                                        {members.length > 0 && (
                                                            <span className="text-xs text-slate-500">
                                                                +{members.length} member{members.length > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-4 mt-1 text-sm text-slate-600">
                                                        <div className="flex items-center space-x-1">
                                                            <Home className="h-3 w-3" />
                                                            <span>{resident.unit.block} - {resident.unit.flat}</span>
                                                        </div>
                                                        {resident.phone && (
                                                            <div className="flex items-center space-x-1">
                                                                <Phone className="h-3 w-3" />
                                                                <span>{resident.phone}</span>
                                                            </div>
                                                        )}
                                                        {resident.email && (
                                                            <div className="flex items-center space-x-1">
                                                                <Mail className="h-3 w-3" />
                                                                <span className="truncate">{resident.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOccupant(resident.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Household Members */}
                                    {isExpanded && members.length > 0 && (
                                        <div className="bg-slate-50 border-t border-slate-200">
                                            {members.map((member) => (
                                                <div key={member.id} className="p-6 pl-20 hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-b-0">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4 flex-1">
                                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <Users className="h-4 w-4 text-purple-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center space-x-2">
                                                                    <h4 className="font-medium text-slate-900">{member.name}</h4>
                                                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                                        Household
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center space-x-4 mt-1 text-sm text-slate-600">
                                                                    {member.phone && (
                                                                        <div className="flex items-center space-x-1">
                                                                            <Phone className="h-3 w-3" />
                                                                            <span>{member.phone}</span>
                                                                        </div>
                                                                    )}
                                                                    {member.email && (
                                                                        <div className="flex items-center space-x-1">
                                                                            <Mail className="h-3 w-3" />
                                                                            <span className="truncate">{member.email}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteOccupant(member.id)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
