import ClientProviders from '@/components/ClientProviders'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: "Kira — Your Community Assistant",
    description: 'Helping communities coordinate everyday life through chat.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
    )
}