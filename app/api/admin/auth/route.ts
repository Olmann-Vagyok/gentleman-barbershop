import { NextRequest, NextResponse } from 'next/server'
import { getAccounts } from '@/lib/store'

export async function POST(req: NextRequest) {
  const { name, password } = await req.json()

  // Admin login
  if (!name || name === 'admin') {
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ role: 'admin', name: 'Admin', barberId: null })
    }
    return NextResponse.json({ error: 'პაროლი არასწორია' }, { status: 401 })
  }

  // Barber login
  const accounts = await getAccounts()
  const account = accounts.find(a => a.name === name && a.password === password)
  if (!account) return NextResponse.json({ error: 'პაროლი არასწორია' }, { status: 401 })

  return NextResponse.json({ role: account.role, name: account.name, barberId: account.barberId ?? null })
}
