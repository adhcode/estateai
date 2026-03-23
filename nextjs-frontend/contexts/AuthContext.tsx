'use client'

import { authService } from '@/services/auth'
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    role: 'SUPER_ADMIN' | 'ESTATE_ADMIN' | 'SECURITY'
    estate?: {
        id: string
        name: string
    }
}

interface AuthContextType {
    user: User | null
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const logout = () => {
        authService.logout()
        setUser(null)
    }

    useEffect(() => {
        // Quick check for existing token on app load
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token')
            const savedUser = localStorage.getItem('user')

            if (token && savedUser) {
                try {
                    setUser(JSON.parse(savedUser))
                } catch (error) {
                    logout()
                }
            }
            setLoading(false)
        }
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const loginData = await authService.login(email, password)
            const { user: userData, access_token: token } = loginData

            if (!userData) {
                throw new Error('Invalid response from server')
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token)
                localStorage.setItem('user', JSON.stringify(userData))
            }
            setUser(userData)
        } catch (error) {
            throw error
        }
    }

    const value = {
        user,
        login,
        logout,
        loading,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}