'use client'

import { useAuth } from '@/contexts/AuthContext'
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { Button, Form, Input, message } from 'antd'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
    const { login } = useAuth()
    const router = useRouter()

    const handleSubmit = async (values: { email: string; password: string }) => {
        setLoading(true)
        try {
            await login(values.email, values.password)
            message.success('Welcome back!')
            router.push('/dashboard')
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-2xl p-8">
                    {/* Logo/Brand */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Kira
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Sign in to your account
                        </p>
                    </div>

                    {/* Login Form */}
                    <Form
                        form={form}
                        name="login"
                        onFinish={handleSubmit}
                        layout="vertical"
                    >
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                        >
                            <Input
                                size="large"
                                placeholder="admin@kira.com"
                                className="rounded-lg"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[{ required: true, message: 'Please enter your password' }]}
                        >
                            <Input.Password
                                size="large"
                                placeholder="Enter your password"
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                className="rounded-lg"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                size="large"
                                className="w-full rounded-lg"
                            >
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    © 2026 Kira. All rights reserved.
                </p>
            </div>
        </div>
    )
}