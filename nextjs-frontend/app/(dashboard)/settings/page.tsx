'use client'

import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Bell, Database, MessageSquare, RefreshCw, Save, Settings, Shield, User } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')
    const [settings, setSettings] = useState({
        profile: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            role: ''
        },
        notifications: {
            emailNotifications: true,
            smsNotifications: false,
            whatsappNotifications: true,
            securityAlerts: true
        },
        security: {
            twoFactorAuth: false,
            sessionTimeout: '30',
            passwordExpiry: '90'
        },
        system: {
            timezone: 'Africa/Lagos',
            dateFormat: 'DD/MM/YYYY',
            language: 'English'
        },
        whatsapp: {
            apiKey: '',
            webhookUrl: '',
            phoneNumber: '',
            isConnected: false
        }
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (user) {
            setSettings(prev => ({
                ...prev,
                profile: {
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    role: user.role || ''
                }
            }))
        }
    }, [user])

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'system', label: 'System', icon: Database },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare }
    ]

    const handleSave = async () => {
        if (!user) return

        try {
            setSaving(true)

            // Update profile if changed
            if (activeTab === 'profile') {
                await api.patch(`/auth/users/${user.id}`, {
                    firstName: settings.profile.firstName,
                    lastName: settings.profile.lastName,
                    phone: settings.profile.phone,
                    email: settings.profile.email
                })
            }

            // For other settings, you would typically save to a settings endpoint
            console.log('Settings saved:', settings)
        } catch (error) {
            console.error('Error saving settings:', error)
        } finally {
            setSaving(false)
        }
    }

    const renderProfileSettings = () => (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <input
                        type="text"
                        value={settings.profile.firstName}
                        onChange={(e) => setSettings({
                            ...settings,
                            profile: { ...settings.profile, firstName: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <input
                        type="text"
                        value={settings.profile.lastName}
                        onChange={(e) => setSettings({
                            ...settings,
                            profile: { ...settings.profile, lastName: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <input
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => setSettings({
                            ...settings,
                            profile: { ...settings.profile, email: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                        type="tel"
                        value={settings.profile.phone}
                        onChange={(e) => setSettings({
                            ...settings,
                            profile: { ...settings.profile, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                        {settings.profile.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                </div>
            </div>
        </div>
    )

    const renderNotificationSettings = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                    { key: 'whatsappNotifications', label: 'WhatsApp Notifications', desc: 'Receive notifications via WhatsApp' },
                    { key: 'securityAlerts', label: 'Security Alerts', desc: 'Receive critical security notifications' }
                ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                        <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                            onChange={(e) => setSettings({
                                ...settings,
                                notifications: { ...settings.notifications, [item.key]: e.target.checked }
                            })}
                            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                    </div>
                ))}
            </div>
        </div>
    )

    const renderSecuritySettings = () => (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, twoFactorAuth: e.target.checked }
                        })}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                    <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, sessionTimeout: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Password Expiry (days)</label>
                    <input
                        type="number"
                        value={settings.security.passwordExpiry}
                        onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, passwordExpiry: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
            </div>
        </div>
    )

    const renderSystemSettings = () => (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Timezone</label>
                    <select
                        value={settings.system.timezone}
                        onChange={(e) => setSettings({
                            ...settings,
                            system: { ...settings.system, timezone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="Africa/Lagos">Africa/Lagos</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                    </select>
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Date Format</label>
                    <select
                        value={settings.system.dateFormat}
                        onChange={(e) => setSettings({
                            ...settings,
                            system: { ...settings.system, dateFormat: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Language</label>
                    <select
                        value={settings.system.language}
                        onChange={(e) => setSettings({
                            ...settings,
                            system: { ...settings.system, language: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="English">English</option>
                        <option value="French">French</option>
                        <option value="Spanish">Spanish</option>
                    </select>
                </div>
            </div>
        </div>
    )

    const renderWhatsAppSettings = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div>
                    <h3 className="font-semibold text-gray-900">WhatsApp Integration</h3>
                    <p className="text-sm text-gray-500">
                        {settings.whatsapp.isConnected ? 'Connected and ready to send messages' : 'Not connected'}
                    </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${settings.whatsapp.isConnected
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                    {settings.whatsapp.isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>

            <div className="grid gap-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">WhatsApp API Key</label>
                    <input
                        type="password"
                        value={settings.whatsapp.apiKey}
                        onChange={(e) => setSettings({
                            ...settings,
                            whatsapp: { ...settings.whatsapp, apiKey: e.target.value }
                        })}
                        placeholder="Enter your WhatsApp API key"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">Webhook URL</label>
                    <input
                        type="url"
                        value={settings.whatsapp.webhookUrl}
                        onChange={(e) => setSettings({
                            ...settings,
                            whatsapp: { ...settings.whatsapp, webhookUrl: e.target.value }
                        })}
                        placeholder="https://your-domain.com/webhook"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">WhatsApp Phone Number</label>
                    <input
                        type="tel"
                        value={settings.whatsapp.phoneNumber}
                        onChange={(e) => setSettings({
                            ...settings,
                            whatsapp: { ...settings.whatsapp, phoneNumber: e.target.value }
                        })}
                        placeholder="+234 XXX XXX XXXX"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
            </div>

            <div className="flex space-x-2">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <RefreshCw className="h-4 w-4" />
                    <span>Test Connection</span>
                </button>
                <button className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <span>Connect WhatsApp</span>
                </button>
            </div>
        </div>
    )

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return renderProfileSettings()
            case 'notifications':
                return renderNotificationSettings()
            case 'security':
                return renderSecuritySettings()
            case 'system':
                return renderSystemSettings()
            case 'whatsapp':
                return renderWhatsAppSettings()
            default:
                return renderProfileSettings()
        }
    }

    return (
        <div className="space-y-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account and system preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-gray-100">
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center space-x-2">
                                <Settings className="h-5 w-5 text-gray-600" />
                                <span className="font-semibold text-gray-900">Settings</span>
                            </div>
                        </div>
                        <nav className="p-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${activeTab === tab.id
                                                ? 'bg-gray-100 text-gray-900'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                )
                            })}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {tabs.find(tab => tab.id === activeTab)?.label} Settings
                            </h2>
                            <p className="text-gray-600 mt-1">
                                Configure your {tabs.find(tab => tab.id === activeTab)?.label.toLowerCase()} preferences
                            </p>
                        </div>
                        <div className="p-6">
                            {renderTabContent()}

                            <div className="flex justify-end space-x-2 mt-8 pt-6 border-t border-gray-100">
                                <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}