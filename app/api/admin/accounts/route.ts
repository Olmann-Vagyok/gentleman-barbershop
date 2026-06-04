import { NextRequest, NextResponse } from 'next/server'
import { getAccounts, setAccounts, type Account } from '@/lib/store'

function checkAdmin(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  return pw && pw === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const accounts = await getAccounts()
  return NextResponse.json({ accounts })
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const account: Account = await req.json()
  const accounts = await getAccounts()
  const existing = accounts.findIndex(a => a.id === account.id)
  if (existing >= 0) accounts[existing] = account
  else accounts.push(account)
  await setAccounts(accounts)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const accounts = await getAccounts()
  await setAccounts(accounts.filter(a => a.id !== id))
  return NextResponse.json({ success: true })
}
