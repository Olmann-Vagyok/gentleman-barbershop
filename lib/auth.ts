import { randomBytes, pbkdf2Sync } from 'crypto'
import { BARBERS } from './data'

export type UserRecord = {
  id: string           // 'admin' or barberId
  username: string     // custom login name — can be changed
  hash: string
  salt: string
  role: 'admin' | 'barber'
  barberId?: string
  displayName: string
}

export type AuthResult =
  | { valid: false }
  | { valid: true; role: 'admin' | 'barber'; userId: string; barberId?: string; displayName: string }

// ─── Password hashing ────────────────────────────────────────────────────────

export function hashPassword(password: string, salt?: string) {
  const s = salt ?? randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex')
  return { hash, salt: s }
}

export function checkHash(password: string, hash: string, salt: string): boolean {
  return hashPassword(password, salt).hash === hash
}

// ─── KV storage ──────────────────────────────────────────────────────────────

function kvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

async function getKv() {
  const { kv } = await import('@vercel/kv')
  return kv
}

function buildFromEnv(): UserRecord[] {
  const users: UserRecord[] = []

  if (process.env.ADMIN_PASSWORD) {
    const { hash, salt } = hashPassword(process.env.ADMIN_PASSWORD)
    users.push({ id: 'admin', username: 'admin', hash, salt, role: 'admin', displayName: 'Admin' })
  }

  for (const barber of BARBERS) {
    const pw = process.env[`BARBER_LOGIN_${barber.id.toUpperCase()}`]
    if (pw) {
      const { hash, salt } = hashPassword(pw)
      users.push({
        id: barber.id,
        username: barber.id,
        hash, salt,
        role: 'barber',
        barberId: barber.id,
        displayName: barber.name,
      })
    }
  }

  return users
}

export async function getUsers(): Promise<UserRecord[]> {
  if (!kvAvailable()) return buildFromEnv()
  try {
    const db = await getKv()
    const stored = await db.get<UserRecord[]>('auth_users')
    if (stored && stored.length > 0) return stored
    // First run — bootstrap from env vars and persist
    const bootstrapped = buildFromEnv()
    if (bootstrapped.length > 0) await db.set('auth_users', bootstrapped)
    return bootstrapped
  } catch {
    return buildFromEnv()
  }
}

export async function setUsers(users: UserRecord[]): Promise<void> {
  const db = await getKv()
  await db.set('auth_users', users)
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function verifyCredentials(username: string, password: string): Promise<AuthResult> {
  const users = await getUsers()
  const user  = users.find(u => u.username.toLowerCase() === username.toLowerCase())
  if (!user || !checkHash(password, user.hash, user.salt)) return { valid: false }
  return { valid: true, role: user.role, userId: user.id, barberId: user.barberId, displayName: user.displayName }
}

export async function authFromRequest(req: Request): Promise<AuthResult> {
  const headers   = req instanceof Request ? req.headers : (req as any).headers
  const username  = headers.get('x-admin-username') ?? 'admin'
  const password  = headers.get('x-admin-password') ?? ''
  return verifyCredentials(username, password)
}
