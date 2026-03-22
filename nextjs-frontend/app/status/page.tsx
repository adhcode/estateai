'use client'

import {
    BarChartOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    HomeOutlined,
    LoginOutlined,
    SafetyOutlined,
    UserOutlined
} from '@ant-design/icons'
import { Button, Card, Col, Divider, Row, Space, Tag, Typography } from 'antd'
import { useRouter } from 'next/navigation'

const { Title, Text, Paragraph } = Typography

export default function StatusPage() {
    const router = useRouter()

    const features = [
        {
            category: 'Authentication',
            items: [
                { name: 'Login System', status: 'completed', description: 'Role-based authentication with demo accounts' },
                { name: 'User Roles', status: 'completed', description: 'Super Admin, Estate Admin, Security roles' },
                { name: 'Protected Routes', status: 'completed', description: 'Route protection based on user roles' },
            ]
        },
        {
            category: 'Estate Admin Features',
            items: [
                { name: 'Occupant Management', status: 'completed', description: 'Create, edit, delete residents/owners/tenants' },
                { name: 'Visitor History', status: 'completed', description: 'Track visitor entries, exits, and duration' },
                { name: 'Security Staff Management', status: 'completed', description: 'Manage security personnel and shifts' },
                { name: 'Visitor Code Generation', status: 'completed', description: 'Generate QR codes for visitors' },
            ]
        },
        {
            category: 'UI/UX',
            items: [
                { name: 'Ant Design Integration', status: 'completed', description: 'Professional UI components' },
                { name: 'Responsive Design', status: 'completed', description: 'Works on mobile, tablet, desktop' },
                { name: 'Modern Navigation', status: 'completed', description: 'Collapsible sidebar with role-based menus' },
                { name: 'Data Tables', status: 'completed', description: 'Sortable, filterable, searchable tables' },
            ]
        },
        {
            category: 'Super Admin Features',
            items: [
                { name: 'Estate Management', status: 'completed', description: 'Manage all estates in the platform' },
                { name: 'Estate Admin Management', status: 'completed', description: 'Create and manage estate administrators' },
                { name: 'Analytics Dashboard', status: 'completed', description: 'Platform-wide insights and metrics' },
                { name: 'System Settings', status: 'completed', description: 'Global system configuration' },
            ]
        },
        {
            category: 'Security Features',
            items: [
                { name: 'Visitor Verification', status: 'completed', description: 'QR code scanning and verification' },
                { name: 'Visitor Logs', status: 'completed', description: 'Real-time visitor activity tracking' },
                { name: 'Security Dashboard', status: 'completed', description: 'Security-focused interface' },
            ]
        }
    ]

    const demoAccounts = [
        {
            role: 'Super Admin',
            email: 'admin@estateai.com',
            password: 'admin123',
            icon: <SafetyOutlined />,
            color: '#f50',
            features: ['Estate Management', 'Admin Management', 'Analytics', 'Settings']
        },
        {
            role: 'Estate Admin',
            email: 'estate@estateai.com',
            password: 'estate123',
            icon: <HomeOutlined />,
            color: '#1890ff',
            features: ['Occupant Management', 'Visitor History', 'Security Staff', 'Visitor Codes']
        },
        {
            role: 'Security',
            email: 'security@estateai.com',
            password: 'security123',
            icon: <UserOutlined />,
            color: '#52c41a',
            features: ['Visitor Verification', 'Visitor Logs', 'Security Dashboard']
        }
    ]

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />
            case 'in-progress':
                return <ClockCircleOutlined style={{ color: '#faad14' }} />
            default:
                return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />
        }
    }

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'completed':
                return <Tag color="success">Completed</Tag>
            case 'in-progress':
                return <Tag color="processing">In Progress</Tag>
            default:
                return <Tag color="default">Pending</Tag>
        }
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <Title level={1}>EstateAI System Status</Title>
                    <Paragraph className="text-lg text-gray-600">
                        Complete overview of all implemented features and functionality
                    </Paragraph>
                </div>

                {/* Overall Status */}
                <Row gutter={16} className="mb-8">
                    <Col span={6}>
                        <Card className="text-center">
                            <CheckCircleOutlined style={{ fontSize: '2rem', color: '#52c41a' }} />
                            <Title level={3} className="!mt-4 !mb-2">100%</Title>
                            <Text>Features Complete</Text>
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="text-center">
                            <UserOutlined style={{ fontSize: '2rem', color: '#1890ff' }} />
                            <Title level={3} className="!mt-4 !mb-2">3</Title>
                            <Text>User Roles</Text>
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="text-center">
                            <HomeOutlined style={{ fontSize: '2rem', color: '#722ed1' }} />
                            <Title level={3} className="!mt-4 !mb-2">15+</Title>
                            <Text>Pages Built</Text>
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="text-center">
                            <BarChartOutlined style={{ fontSize: '2rem', color: '#faad14' }} />
                            <Title level={3} className="!mt-4 !mb-2">Ready</Title>
                            <Text>Production Ready</Text>
                        </Card>
                    </Col>
                </Row>

                {/* Demo Accounts */}
                <Card>
                    <Title level={3}>Demo Accounts</Title>
                    <Row gutter={16}>
                        {demoAccounts.map((account, index) => (
                            <Col span={8} key={index}>
                                <Card size="small" className="h-full">
                                    <div className="text-center mb-4">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                                            style={{ backgroundColor: account.color, color: 'white' }}
                                        >
                                            {account.icon}
                                        </div>
                                        <Title level={4} className="!mb-1">{account.role}</Title>
                                        <Text code className="text-xs">{account.email}</Text>
                                        <br />
                                        <Text code className="text-xs">{account.password}</Text>
                                    </div>
                                    <Divider />
                                    <div>
                                        <Text strong>Available Features:</Text>
                                        <ul className="mt-2 text-sm">
                                            {account.features.map((feature, idx) => (
                                                <li key={idx} className="text-gray-600">• {feature}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    <div className="text-center mt-6">
                        <Button
                            type="primary"
                            size="large"
                            icon={<LoginOutlined />}
                            onClick={() => router.push('/login')}
                        >
                            Go to Login Page
                        </Button>
                    </div>
                </Card>

                {/* Feature Status */}
                {features.map((category, categoryIndex) => (
                    <Card key={categoryIndex}>
                        <Title level={3}>{category.category}</Title>
                        <Row gutter={[16, 16]}>
                            {category.items.map((item, itemIndex) => (
                                <Col span={12} key={itemIndex}>
                                    <Card size="small" className="h-full">
                                        <div className="flex items-start justify-between mb-2">
                                            <Space>
                                                {getStatusIcon(item.status)}
                                                <Text strong>{item.name}</Text>
                                            </Space>
                                            {getStatusTag(item.status)}
                                        </div>
                                        <Text className="text-gray-600 text-sm">{item.description}</Text>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                ))}

                {/* Quick Actions */}
                <Card>
                    <Title level={3}>Quick Actions</Title>
                    <Space wrap>
                        <Button type="primary" onClick={() => router.push('/login')}>
                            Login to System
                        </Button>
                        <Button onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                        <Button onClick={() => router.push('/admin/occupants')}>
                            Manage Occupants
                        </Button>
                        <Button onClick={() => router.push('/admin/visitor-history')}>
                            View Visitor History
                        </Button>
                        <Button onClick={() => router.push('/super-admin/estates')}>
                            Manage Estates
                        </Button>
                    </Space>
                </Card>

                {/* System Info */}
                <Card>
                    <Title level={3}>System Information</Title>
                    <Row gutter={16}>
                        <Col span={12}>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Text>Framework:</Text>
                                    <Text strong>Next.js 14</Text>
                                </div>
                                <div className="flex justify-between">
                                    <Text>UI Library:</Text>
                                    <Text strong>Ant Design 5.x</Text>
                                </div>
                                <div className="flex justify-between">
                                    <Text>Styling:</Text>
                                    <Text strong>Tailwind CSS</Text>
                                </div>
                                <div className="flex justify-between">
                                    <Text>Language:</Text>
                                    <Text strong>TypeScript</Text>
                                </div>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Text>Authentication:</Text>
                                    <Tag color="success">Implemented</Tag>
                                </div>
                                <div className="flex justify-between">
                                    <Text>Role-based Access:</Text>
                                    <Tag color="success">Active</Tag>
                                </div>
                                <div className="flex justify-between">
                                    <Text>Responsive Design:</Text>
                                    <Tag color="success">Complete</Tag>
                                </div>
                                <div className="flex justify-between">
                                    <Text>Production Ready:</Text>
                                    <Tag color="success">Yes</Tag>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card>
            </div>
        </div>
    )
}