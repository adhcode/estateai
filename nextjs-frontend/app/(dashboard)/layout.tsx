'use client'

import { useAuth } from '@/contexts/AuthContext'
import {
    Building2,
    Clock,
    Home,
    LogOut,
    Menu,
    QrCode,
    Shield,
    Users,
    X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    const getNavItems = () => {
        const baseItems = [
            { name: 'Dashboard', href: '/dashboard', icon: Home },
        ]

        switch (user.role) {
            case 'SUPER_ADMIN':
                return [
                    ...baseItems,
                    { name: 'Estates', href: '/super-admin/estates', icon: Building2 },
                    { name: 'Estate Admins', href: '/super-admin/estate-admins', icon: Users },
                    { name: 'All Users', href: '/super-admin/users', icon: Users },
                ]
            case 'ESTATE_ADMIN':
                return [
                    ...baseItems,
                    { name: 'Occupants', href: '/admin/occupants', icon: Users },
                    { name: 'Visitors', href: '/admin/visitors', icon: QrCode },
                    { name: 'History', href: '/admin/visitor-history', icon: Clock },
                    { name: 'Security', href: '/admin/security-staff', icon: Shield },
                ]
            case 'SECURITY':
                return [
                    ...baseItems,
                    { name: 'Verify', href: '/security/verification', icon: QrCode },
                    { name: 'Log', href: '/security/visitor-log', icon: Clock },
                ]
            default:
                return baseItems
        }
    }

    const navItems = getNavItems()

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
                        <span className="text-2xl font-bold text-black">Kira</span>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-md hover:bg-slate-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* User info */}
                    <div className="px-6 py-6 border-b border-slate-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                    {user.firstName[0]}{user.lastName[0]}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {user.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                        ? 'bg-black text-white'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="px-4 py-4 border-t border-slate-200">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-md hover:bg-slate-100"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>

                {/* Page content */}
                <main className="p-6 max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
