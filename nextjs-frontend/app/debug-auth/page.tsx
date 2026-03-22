'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
    const { user, loading } = useAuth()
    const [localStorageData, setLocalStorageData] = useState<any>({})

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setLocalStorageData({
                token: localStorage.getItem('token'),
                user: localStorage.getItem('user'),
                parsedUser: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null
            })
        }
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Auth Context State</h2>
                        <div className="space-y-2">
                            <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
                            <p><strong>User:</strong> {user ? 'Logged in' : 'Not logged in'}</p>
                            {user && (
                                <div className="mt-4 p-4 bg-gray-100 rounded">
                                    <pre>{JSON.stringify(user, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">LocalStorage Data</h2>
                        <div className="space-y-2">
                            <p><strong>Token exists:</strong> {localStorageData.token ? 'Yes' : 'No'}</p>
                            <p><strong>User data exists:</strong> {localStorageData.user ? 'Yes' : 'No'}</p>
                            {localStorageData.parsedUser && (
                                <div className="mt-4 p-4 bg-gray-100 rounded">
                                    <pre>{JSON.stringify(localStorageData.parsedUser, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Raw LocalStorage</h2>
                    <div className="space-y-2">
                        <p><strong>Token:</strong> {localStorageData.token || 'None'}</p>
                        <p><strong>User JSON:</strong> {localStorageData.user || 'None'}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}