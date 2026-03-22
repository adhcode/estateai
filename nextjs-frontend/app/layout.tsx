import ClientProviders from '@/components/ClientProviders'
import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import './globals.css'

const bricolage = Bricolage_Grotesque({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-bricolage'
})

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
            <body className={bricolage.className}>
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
    )
}