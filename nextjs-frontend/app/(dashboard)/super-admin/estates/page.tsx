'use client'

import api from '@/services/api'
import { Building2, Edit, MapPin, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Estate {
    id: string
    name: string
    address: string
    phoneNumber?: string
    description?: string
    createdAt: string
    updatedAt: string
    isActive: boolean
    _count?: {
        units: number
        occupants: number
        visitorCodes: number
    }
}

interface UnitConfig {
    totalUnits: number
    totalBlocks: number
    flatsPerBlock: number
    occupiedUnits: number
    availableUnits: number
    blockPrefix: string
    flatPrefix: string
}

export default function EstatesPage() {
    console.log('EstatesPage component is rendering')
    const [estates, setEstates] = useState<Estate[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [showEditForm, setShowEditForm] = useState(false)
    const [editingEstate, setEditingEstate] = useState<Estate | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phoneNumber: '',
        description: '',
        unitConfig: {
            totalBlocks: 40,
            flatsPerBlock: 12,
            blockPrefix: 'Block',
            flatPrefix: 'Flat'
        }
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [currentUnitConfig, setCurrentUnitConfig] = useState<UnitConfig | null>(null)
    const [showManageUnits, setShowManageUnits] = useState(false)

    useEffect(() => {
        fetchEstates()
    }, [])

    const fetchEstates = async () => {
        try {
            setLoading(true)
            const response = await api.get('/estates')
            console.log('Estates API response:', response.data)
            // Handle both array and object with data property
            const estatesData = Array.isArray(response.data) ? response.data : (response.data.data || [])
            setEstates(estatesData)
        } catch (error) {
            console.error('Error fetching estates:', error)
            setEstates([]) // Set empty array on error
        } finally {
            setLoading(false)
        }
    }

    const handleCreateEstate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        try {
            setSubmitting(true)
            const response = await api.post('/estates', formData)
            console.log('Estate created:', response.data)
            setShowCreateForm(false)
            setFormData({
                name: '',
                address: '',
                phoneNumber: '',
                description: '',
                unitConfig: {
                    totalBlocks: 40,
                    flatsPerBlock: 12,
                    blockPrefix: 'Block',
                    flatPrefix: 'Flat'
                }
            })
            setSuccess(`Estate created successfully with ${formData.unitConfig.totalBlocks * formData.unitConfig.flatsPerBlock} units!`)
            setTimeout(() => setSuccess(null), 5000)
            fetchEstates()
        } catch (error: any) {
            console.error('Error creating estate:', error)
            setError(error.response?.data?.message || 'Failed to create estate')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteEstate = async (id: string) => {
        if (!confirm('Are you sure you want to delete this estate?')) return

        try {
            await api.delete(`/estates/${id}`)
            fetchEstates()
        } catch (error) {
            console.error('Error deleting estate:', error)
        }
    }

    const handleEditEstate = async (estate: Estate) => {
        setEditingEstate(estate)
        setFormData({
            name: estate.name,
            address: estate.address,
            phoneNumber: estate.phoneNumber || '',
            description: estate.description || '',
            unitConfig: {
                totalBlocks: 40,
                flatsPerBlock: 12,
                blockPrefix: 'Block',
                flatPrefix: 'Flat'
            }
        })

        // Fetch current unit configuration
        try {
            const response = await api.get(`/estates/${estate.id}/units/configuration`)
            setCurrentUnitConfig(response.data)
        } catch (error) {
            console.error('Error fetching unit config:', error)
        }

        setShowEditForm(true)
    }

    const handleUpdateEstate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingEstate) return

        setError(null)
        try {
            setSubmitting(true)
            // Don't send unitConfig in update
            const { unitConfig, ...updateData } = formData
            await api.patch(`/estates/${editingEstate.id}`, updateData)
            setShowEditForm(false)
            setEditingEstate(null)
            setCurrentUnitConfig(null)
            setSuccess('Estate updated successfully!')
            setTimeout(() => setSuccess(null), 5000)
            fetchEstates()
        } catch (error: any) {
            console.error('Error updating estate:', error)
            setError(error.response?.data?.message || 'Failed to update estate')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReconfigureUnits = async () => {
        if (!editingEstate || !currentUnitConfig) return

        if (currentUnitConfig.occupiedUnits > 0) {
            if (!confirm(
                `Warning: This estate has ${currentUnitConfig.occupiedUnits} occupied units.\n\n` +
                `This will DELETE all ${currentUnitConfig.availableUnits} unoccupied units and create new ones based on your configuration.\n\n` +
                `Occupied units will NOT be affected.\n\nContinue?`
            )) {
                return
            }
        }

        setError(null)
        try {
            setSubmitting(true)

            // Step 1: Delete unoccupied units
            await api.delete(`/estates/${editingEstate.id}/units/unoccupied`)

            // Step 2: Create new units with new configuration
            await api.post(`/estates/${editingEstate.id}/units/bulk-create`, formData.unitConfig)

            // Step 3: Refresh unit configuration
            const response = await api.get(`/estates/${editingEstate.id}/units/configuration`)
            setCurrentUnitConfig(response.data)

            setSuccess(`Units reconfigured successfully! Created ${formData.unitConfig.totalBlocks * formData.unitConfig.flatsPerBlock} new units.`)
            setTimeout(() => setSuccess(null), 5000)
            setShowManageUnits(false)
        } catch (error: any) {
            console.error('Error reconfiguring units:', error)
            setError(error.response?.data?.message || 'Failed to reconfigure units')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-600">Loading estates...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Estates</h1>
                    <p className="text-gray-600">Manage all estates in the platform</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Estate</span>
                </button>
            </div>

            {/* Create Form Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Estate</h2>
                        <form onSubmit={handleCreateEstate} className="space-y-6">
                            {/* Estate Details */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Estate Details</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estate Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        placeholder="Enter estate name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        placeholder="Enter address"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        rows={3}
                                        placeholder="Enter description"
                                    />
                                </div>
                            </div>

                            {/* Unit Configuration */}
                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Unit Configuration</h3>
                                    <p className="text-sm text-gray-600">Define the structure of units in this estate</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Total Blocks *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="100"
                                            value={formData.unitConfig.totalBlocks}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                unitConfig: { ...formData.unitConfig, totalBlocks: parseInt(e.target.value) || 1 }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            placeholder="40"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Flats per Block *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="50"
                                            value={formData.unitConfig.flatsPerBlock}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                unitConfig: { ...formData.unitConfig, flatsPerBlock: parseInt(e.target.value) || 1 }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            placeholder="12"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Block Prefix
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.unitConfig.blockPrefix}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                unitConfig: { ...formData.unitConfig, blockPrefix: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            placeholder="Block"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Flat Prefix
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.unitConfig.flatPrefix}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                unitConfig: { ...formData.unitConfig, flatPrefix: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            placeholder="Flat"
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-blue-900 mb-2">Preview</p>
                                    <div className="space-y-1 text-sm text-blue-800">
                                        <p>Total Units: <span className="font-semibold">{formData.unitConfig.totalBlocks * formData.unitConfig.flatsPerBlock}</span></p>
                                        <p>Example: {formData.unitConfig.blockPrefix} 1, {formData.unitConfig.flatPrefix} 1</p>
                                        <p>Last Unit: {formData.unitConfig.blockPrefix} {formData.unitConfig.totalBlocks}, {formData.unitConfig.flatPrefix} {formData.unitConfig.flatsPerBlock}</p>
                                    </div>
                                </div>
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
                                    {submitting ? 'Creating...' : 'Create Estate & Units'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Form Modal */}
            {showEditForm && editingEstate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Estate</h2>
                        <form onSubmit={handleUpdateEstate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estate Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter estate name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    rows={3}
                                    placeholder="Enter description"
                                />
                            </div>

                            {/* Current Unit Configuration */}
                            {currentUnitConfig && (
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">Unit Configuration</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowManageUnits(!showManageUnits)}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            {showManageUnits ? 'Hide' : 'Manage Units'}
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Units:</span>
                                            <span className="font-semibold">{currentUnitConfig.totalUnits}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Blocks:</span>
                                            <span className="font-semibold">{currentUnitConfig.totalBlocks}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Flats per Block:</span>
                                            <span className="font-semibold">{currentUnitConfig.flatsPerBlock}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Occupied:</span>
                                            <span className="font-semibold text-blue-600">{currentUnitConfig.occupiedUnits}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Available:</span>
                                            <span className="font-semibold text-green-600">{currentUnitConfig.availableUnits}</span>
                                        </div>
                                    </div>

                                    {/* Manage Units Section */}
                                    {showManageUnits && (
                                        <div className="mt-4 space-y-4">
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                <p className="text-sm text-yellow-800">
                                                    <strong>Warning:</strong> Reconfiguring will delete all unoccupied units and create new ones. Occupied units will not be affected.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Total Blocks
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        value={formData.unitConfig.totalBlocks}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            unitConfig: { ...formData.unitConfig, totalBlocks: parseInt(e.target.value) || 1 }
                                                        })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Flats per Block
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="50"
                                                        value={formData.unitConfig.flatsPerBlock}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            unitConfig: { ...formData.unitConfig, flatsPerBlock: parseInt(e.target.value) || 1 }
                                                        })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleReconfigureUnits}
                                                disabled={submitting}
                                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                                            >
                                                {submitting ? 'Reconfiguring...' : 'Reconfigure Units'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditForm(false)
                                        setEditingEstate(null)
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Updating...' : 'Update Estate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Estates Grid */}
            {estates.length === 0 ? (
                <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No estates found</h3>
                    <p className="text-gray-500 mb-4">Get started by creating your first estate</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Create Estate
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {estates.map((estate) => (
                        <div key={estate.id} className="bg-white rounded-2xl p-6 border border-gray-100">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{estate.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            Created {new Date(estate.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleEditEstate(estate)}
                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEstate(estate.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <MapPin className="h-4 w-4" />
                                    <span>{estate.address}</span>
                                </div>
                                {estate.phoneNumber && (
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <span>📞</span>
                                        <span>{estate.phoneNumber}</span>
                                    </div>
                                )}
                            </div>

                            {estate.description && (
                                <p className="text-sm text-gray-600 mb-4">{estate.description}</p>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <Users className="h-4 w-4" />
                                    <span>0 residents</span>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${estate.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {estate.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}