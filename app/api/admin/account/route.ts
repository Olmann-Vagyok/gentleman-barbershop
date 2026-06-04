import { NextRequest, NextResponse } from 'next/server'
import { getUsers, setUsers, checkHash, hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const username  = req.headers.get('x-admin-username')?.trim().toLowerCase()
  const currentPw = req.headers.get('x-admin-password') ?? ''

  if (!username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { newUsername, newPassword } = await req.json()

  const users = await getUsers()
  const idx   = users.findIndex(u => u.username.toLowerCase() === username)

  if (idx === -1 || !checkHash(currentPw, users[idx].hash, users[idx].salt)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (newUsername) {
    const taken = users.find(u => u.username.toLowerCase() === newUsername.toLowerCase() && u.id !== users[idx].id)
    if (taken) return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    users[idx] = { ...users[idx], username: newUsername.trim() }
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    const { hash, salt } = hashPassword(newPassword)
    users[idx] = { ...users[idx], hash, salt }
  }

  await setUsers(users)
  return NextResponse.json({ success: true, username: users[idx].username })
}
