import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const result = await verifyCredentials(username.trim().toLowerCase(), password)
  if (!result.valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  return NextResponse.json({
    role:        result.role,
    barberId:    result.barberId,
    displayName: result.displayName,
  })
}
