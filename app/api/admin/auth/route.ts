import { NextRequest, NextResponse } from 'next/server'
import { BARBERS } from '@/lib/data'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  // Admin login
  if (username === 'admin') {
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ role: 'admin' })
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Barber login — username must match a barber id
  const barber = BARBERS.find(b => b.id === username.toLowerCase())
  if (barber) {
    const envKey = `BARBER_LOGIN_${username.toUpperCase()}`
    const expectedPw = process.env[envKey]
    if (expectedPw && password === expectedPw) {
      return NextResponse.json({ role: 'barber', barberId: barber.id, barberName: barber.name })
    }
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
