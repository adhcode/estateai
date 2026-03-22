'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'

interface ClientProvidersProps {
    children: React.ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
    return (
        <AntdRegistry>
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#3b82f6',
                        borderRadius: 8,
                    },
                }}
            >
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ConfigProvider>
        </AntdRegistry>
    )
}