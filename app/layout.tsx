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
  title: 'Gentleman Barbershop თბილისი',
  description:
    'პრემიუმ სალონი თბილისში. პროფესიული სტრიჟკები, წვერის მოვლა და სტაილინგი. დაჯავშნე ონლაინ.',
  keywords: 'სალონი თბილისი, სტრიჟკა თბილისი, წვერის შეჭრა, gentleman barbershop',
  openGraph: {
    title: 'Gentleman Barbershop თბილისი',
    description: 'სიზუსტე. სტილი. ხასიათი. პრემიუმ სალონი თბილისის გულში.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  )
}
