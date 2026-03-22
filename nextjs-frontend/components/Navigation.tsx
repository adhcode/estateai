'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
    BarChart3,
    Building2,
    CheckCircle,
    Clock,
    Home,
    LogOut,
    Menu,
    QrCode,
    Settings,
    Shield,
    UserPlus,
    Users,
    X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
    path: string
    label: string
    icon: React.ReactNode
}

export default function Navigation() {
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const getNavItems = (): NavItem[] => {
        const baseItems = [
            { path: '/dashboard/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
        ]

        switch (user?.role) {
            case 'SUPER_ADMIN':
                return [
                    ...baseItems,
                    { path: '/dashboard/super-admin/estates', label: 'Manage Estates', icon: <Building2 className="h-5 w-5" /> },
                    { path: '/dashboard/super-admin/estate-admins', label: 'Estate Admins', icon: <UserPlus className="h-5 w-5" /> },
                    { path: '/dashboard/super-admin/users', label: 'User Management', icon: <Users className="h-5 w-5" /> },
                    { path: '/dashboard/analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
                    { path: '/dashboard/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
                ]
            case 'ESTATE_ADMIN':
                return [
                    ...baseItems,
                    { path: '/dashboard/admin/occupants', label: 'Manage Occupants', icon: <Users className="h-5 w-5" /> },
                    { path: '/dashboard/admin/residents', label: 'Manage Residents', icon: <Users className="h-5 w-5" /> },
                    { path: '/dashboard/admin/security-staff', label: 'Security Staff', icon: <Shield className="h-5 w-5" /> },
                    { path: '/dashboard/admin/visitors', label: 'Visitor Codes', icon: <QrCode className="h-5 w-5" /> },
                    { path: '/dashboard/admin/visitor-history', label: 'Visitor History', icon: <Clock className="h-5 w-5" /> },
                    { path: '/dashboard/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
                ]
            case 'SECURITY':
                return [
                    ...baseItems,
                    { path: '/dashboard/security/verification', label: 'Verify Visitors', icon: <CheckCircle className="h-5 w-5" /> },
                    { path: '/dashboard/security/visitor-log', label: 'Visitor Log', icon: <Clock className="h-5 w-5" /> },
                ]
            default:
                return baseItems
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'from-red-500 to-red-600'
            case 'ESTATE_ADMIN': return 'from-blue-500 to-blue-600'
            case 'SECURITY': return 'from-green-500 to-green-600'
            default: return 'from-gray-500 to-gray-600'
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'Super Admin'
            case 'ESTATE_ADMIN': return 'Estate Admin'
            case 'SECURITY': return 'Security'
            default: return role
        }
    }

    if (!user) return null

    return (
        <>
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-bold text-gray-900">
                                    Kira
                                </h1>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {getNavItems().map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={cn(
                                        "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                        pathname === item.path
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    )}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-3">
                                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50">
                                    <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium text-sm">
                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                    </div>
                                    <div className="hidden lg:block">
                                        <p className="text-sm font-medium text-gray-900">
                                            {user.firstName} {user.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {getRoleBadge(user.role)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={logout}
                                variant="outline"
                                size="sm"
                                className="hidden sm:flex items-center space-x-2"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </Button>

                            {/* Mobile menu button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden hover:bg-slate-100"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-4 py-4 space-y-3">
                            {/* User info on mobile */}
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {getRoleBadge(user.role)}
                                    </p>
                                </div>
                            </div>

                            {/* Navigation items */}
                            <div className="space-y-1">
                                {getNavItems().map((item) => (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium",
                                            pathname === item.path
                                                ? 'bg-gray-900 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        )}
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Logout button on mobile */}
                            <Button
                                onClick={logout}
                                variant="outline"
                                className="w-full flex items-center justify-center space-x-2 py-2"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </Button>
                        </div>
                    </div>
                )}
            </nav>
        </>
    )
}