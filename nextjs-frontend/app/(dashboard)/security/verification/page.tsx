'use client'

import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { Camera, CheckCircle, Clock, Keyboard, MapPin, QrCode, User, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface VerificationResult {
    success: boolean
    visitorCode?: {
        id: string
        code: string
        visitorName: string
        visitorPhone?: string
        purpose?: string
        status: string
        expiresAt: string
        occupant: {
            name: string
            unit: {
                block: string
                flat: string
            }
            primaryOccupant?: {
                name: string
                phone?: string
            }
        }
    }
    message: string
}

export default function VerificationPage() {
    const { user } = useAuth()
    const [code, setCode] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [result, setResult] = useState<VerificationResult | null>(null)
    const [inputMethod, setInputMethod] = useState<'manual' | 'qr'>('manual')
    const [isScanning, setIsScanning] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const handleVerification = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!user?.estate?.id || !code) return

        try {
            setVerifying(true)
            setResult(null)

            const response = await api.post('/visitor-codes/validate', {
                code: code.toUpperCase()
            })

            const validationData = response.data.data || response.data
            const isValid = validationData.valid === true

            if (isValid) {
                setResult({
                    success: true,
                    visitorCode: validationData.visitorCode,
                    message: validationData.message || 'Access granted'
                })

                // Auto-clear after 5 seconds on success
                setTimeout(() => {
                    resetForm()
                }, 5000)
            } else {
                setResult({
                    success: false,
                    message: validationData.message || 'Access denied'
                })
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Invalid visitor code'
            })
        } finally {
            setVerifying(false)
        }
    }

    const resetForm = () => {
        setCode('')
        setResult(null)
        stopCamera()
    }

    const handleCodeInput = (value: string) => {
        const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
        setCode(cleaned)

        // Auto-submit when 6 characters are entered
        if (cleaned.length === 6) {
            setTimeout(() => {
                handleVerification()
            }, 300)
        }
    }

    const startCamera = async () => {
        try {
            setIsScanning(true)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
        } catch (error) {
            console.error('Error accessing camera:', error)
            alert('Unable to access camera. Please check permissions.')
            setIsScanning(false)
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setIsScanning(false)
    }

    const handleQRScan = () => {
        const simulatedCode = prompt('QR Scanner: Enter the scanned code:')
        if (simulatedCode) {
            setCode(simulatedCode.toUpperCase())
            stopCamera()
            setInputMethod('manual')
            // Auto-verify after setting code
            setTimeout(() => {
                handleVerification()
            }, 300)
        }
    }

    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <QrCode className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Visitor Verification</h1>
                <p className="text-slate-600">Scan or enter visitor code to verify access</p>
            </div>

            {/* Input Method Selection */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex space-x-3 mb-6">
                    <button
                        onClick={() => {
                            setInputMethod('qr')
                            startCamera()
                        }}
                        className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-colors ${inputMethod === 'qr'
                            ? 'bg-black text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        <Camera className="h-5 w-5" />
                        <span>Scan QR</span>
                    </button>
                    <button
                        onClick={() => {
                            setInputMethod('manual')
                            stopCamera()
                        }}
                        className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-colors ${inputMethod === 'manual'
                            ? 'bg-black text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        <Keyboard className="h-5 w-5" />
                        <span>Enter Code</span>
                    </button>
                </div>

                {/* QR Scanner */}
                {inputMethod === 'qr' && (
                    <div className="space-y-4">
                        <div className="relative bg-slate-100 rounded-xl overflow-hidden" style={{ aspectRatio: '1' }}>
                            {isScanning ? (
                                <div className="relative w-full h-full">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
                                    </div>
                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                        <button
                                            onClick={handleQRScan}
                                            className="bg-white text-black px-6 py-2 rounded-lg font-medium shadow-lg"
                                        >
                                            Scan Code
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <QrCode className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                                        <p className="text-slate-600 mb-4">Camera will appear here</p>
                                        <button
                                            onClick={startCamera}
                                            className="bg-black text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors"
                                        >
                                            Start Camera
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Manual Input */}
                {inputMethod === 'manual' && !result && (
                    <form onSubmit={handleVerification} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                                Access Code
                            </label>
                            <input
                                type="text"
                                required
                                value={code}
                                onChange={(e) => handleCodeInput(e.target.value)}
                                className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-center text-3xl font-bold tracking-widest transition-all"
                                placeholder="••••••"
                                maxLength={6}
                                autoFocus
                                disabled={verifying}
                            />
                            <p className="text-xs text-slate-500 text-center mt-2">
                                {code.length}/6 characters
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={verifying || !code}
                                className="flex-1 px-6 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                disabled={verifying || code.length !== 6}
                                className="flex-1 px-6 py-4 bg-black text-white rounded-2xl hover:bg-slate-800 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                {verifying ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </span>
                                ) : 'Verify'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Verification Result */}
            {result && (
                <div className={`rounded-2xl p-6 border-2 shadow-sm ${result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-center justify-center mb-4">
                        {result.success ? (
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-10 w-10 text-white" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                                <XCircle className="h-10 w-10 text-white" />
                            </div>
                        )}
                    </div>
                    <h3 className={`text-2xl font-bold text-center mb-2 ${result.success ? 'text-green-900' : 'text-red-900'
                        }`}>
                        {result.success ? 'Access Granted' : 'Access Denied'}
                    </h3>
                    <p className={`text-center mb-6 ${result.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                        {result.message}
                    </p>

                    {/* Visitor Details */}
                    {result.success && result.visitorCode && (
                        <div className="space-y-4 mb-6">
                            <div className="bg-white rounded-xl p-4 space-y-3">
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-600">Visitor</p>
                                        <p className="font-semibold text-slate-900 text-lg">{result.visitorCode.visitorName}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MapPin className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-600">Visiting</p>
                                        <p className="font-semibold text-slate-900">{result.visitorCode.occupant.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {result.visitorCode.occupant.unit.block} - {result.visitorCode.occupant.unit.flat}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Clock className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-600">Valid Until</p>
                                        <p className="font-semibold text-slate-900">
                                            {new Date(result.visitorCode.expiresAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {result.visitorCode.purpose && (
                                    <div className="pt-3 border-t border-slate-200">
                                        <p className="text-sm text-slate-600 mb-1">Purpose of Visit</p>
                                        <p className="font-medium text-slate-900">{result.visitorCode.purpose}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={resetForm}
                        className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-medium shadow-lg"
                    >
                        Verify Another Code
                    </button>
                </div>
            )}

            {/* Quick Tips */}
            {!result && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Quick Tips
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold">1.</span>
                            <span>Ask visitor for their 6-digit code</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold">2.</span>
                            <span>Enter code - it will verify automatically</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold">3.</span>
                            <span>Check visitor details match before granting access</span>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    )
}
