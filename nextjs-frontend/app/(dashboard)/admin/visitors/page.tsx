'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import { visitorsService } from '@/services/visitors'
import type { VisitorCode } from '@/types'
import { Clock, Eye, Plus, QrCode, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function VisitorsPage() {
    const { user } = useAuth()
    const [visitorCodes, setVisitorCodes] = useState<VisitorCode[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newVisitor, setNewVisitor] = useState({
        visitorName: '',
        visitorPhone: '',
        purpose: '',
        validUntil: '',
        unitId: ''
    })

    useEffect(() => {
        if (user?.estate?.id) {
            loadVisitorCodes()
        }
    }, [user])

    const loadVisitorCodes = async () => {
        if (!user?.estate?.id) return

        try {
            const codes = await visitorsService.getByEstate(user.estate.id)
            setVisitorCodes(codes)
        } catch (error) {
            console.error('Failed to load visitor codes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateVisitor = async () => {
        if (!user?.estate?.id) return

        try {
            await visitorsService.generate({
                visitorName: newVisitor.visitorName,
                visitorPhone: newVisitor.visitorPhone,
                purpose: newVisitor.purpose,
                occupantId: newVisitor.unitId, // This should be occupantId
                estateId: user.estate.id,
                expiresAt: newVisitor.validUntil
            })
            setIsCreateDialogOpen(false)
            setNewVisitor({
                visitorName: '',
                visitorPhone: '',
                purpose: '',
                validUntil: '',
                unitId: ''
            })
            loadVisitorCodes()
        } catch (error) {
            console.error('Failed to create visitor code:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>
            case 'USED':
                return <Badge className="bg-blue-100 text-blue-800">Used</Badge>
            case 'EXPIRED':
                return <Badge className="bg-red-100 text-red-800">Expired</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const filteredCodes = visitorCodes.filter(code =>
        code.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Visitor Management</h1>
                    <p className="text-muted-foreground mt-2">Generate and manage visitor access codes</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="mt-4 lg:mt-0">
                            <Plus className="h-4 w-4 mr-2" />
                            Generate Visitor Code
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Generate Visitor Code</DialogTitle>
                            <DialogDescription>
                                Create a new visitor access code with QR code for easy verification.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="visitorName">Visitor Name</Label>
                                <Input
                                    id="visitorName"
                                    value={newVisitor.visitorName}
                                    onChange={(e) => setNewVisitor({ ...newVisitor, visitorName: e.target.value })}
                                    placeholder="Enter visitor's full name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="visitorPhone">Phone Number</Label>
                                <Input
                                    id="visitorPhone"
                                    value={newVisitor.visitorPhone}
                                    onChange={(e) => setNewVisitor({ ...newVisitor, visitorPhone: e.target.value })}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="purpose">Purpose of Visit</Label>
                                <Input
                                    id="purpose"
                                    value={newVisitor.purpose}
                                    onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                                    placeholder="e.g., Delivery, Meeting, etc."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="validUntil">Valid Until</Label>
                                <Input
                                    id="validUntil"
                                    type="datetime-local"
                                    value={newVisitor.validUntil}
                                    onChange={(e) => setNewVisitor({ ...newVisitor, validUntil: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="unitId">Unit ID</Label>
                                <Input
                                    id="unitId"
                                    value={newVisitor.unitId}
                                    onChange={(e) => setNewVisitor({ ...newVisitor, unitId: e.target.value })}
                                    placeholder="Enter unit ID"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleCreateVisitor}>
                                Generate Code
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by visitor name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Visitor Codes Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <QrCode className="h-5 w-5" />
                        <span>Visitor Codes</span>
                    </CardTitle>
                    <CardDescription>
                        All generated visitor codes and their current status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Visitor Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead>Valid Until</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCodes.map((code) => (
                                <TableRow key={code.id}>
                                    <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                                    <TableCell>{code.visitorName}</TableCell>
                                    <TableCell>{code.visitorPhone}</TableCell>
                                    <TableCell>{code.purpose}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-1">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{new Date(code.expiresAt).toLocaleString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(code.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <QrCode className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredCodes.length === 0 && (
                        <div className="text-center py-8">
                            <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No visitor codes found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}