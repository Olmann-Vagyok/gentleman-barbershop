import { NextRequest, NextResponse } from 'next/server'
import { getUsers, setUsers, hashPassword, authFromRequest } from '@/lib/auth'

async function isAdmin(req: NextRequest): Promise<boolean> {
  const result = await authFromRequest(req)
  return result.valid && result.role === 'admin'
}

// GET — list all users (without hashes)
export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const users = await getUsers()
  return NextResponse.json({
    users: users.map(({ hash, salt, ...u }) => u),
  })
}

// POST — admin sets username or password for any user
export async function POST(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, username, password } = await req.json()

  const users = await getUsers()
  const idx   = users.findIndex(u => u.id === userId)
  if (idx === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (username !== undefined) {
    const taken = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== userId)
    if (taken) return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    users[idx] = { ...users[idx], username: username.trim() }
  }

  if (password !== undefined) {
    if (password.length < 6) return NextResponse.json({ error: 'Password too short (min 6)' }, { status: 400 })
    const { hash, salt } = hashPassword(password)
    users[idx] = { ...users[idx], hash, salt }
  }

  await setUsers(users)
  const { hash, salt, ...safe } = users[idx]
  return NextResponse.json({ success: true, user: safe })
}
