import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Gentleman Barbershop Tbilisi',
  description:
    'Premium barbershop in Tbilisi. Expert haircuts, beard grooming, and styling. Book your appointment online.',
  keywords: 'barbershop tbilisi, haircut tbilisi, beard trim, gentleman barbershop',
  openGraph: {
    title: 'Gentleman Barbershop Tbilisi',
    description: 'Precision. Style. Character. Premium barbershop in the heart of Tbilisi.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  )
}
