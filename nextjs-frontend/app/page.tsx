'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.push('/dashboard')
            } else {
                router.push('/login')
            }
        }
    }, [user, loading, router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            <div className="animate-pulse">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
        </div>
    )
}