import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { authFromRequest } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await authFromRequest(req)
  if (!session.valid || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext      = file.name.split('.').pop()
  const filename = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const blob     = await put(filename, file, { access: 'public' })
  return NextResponse.json({ url: blob.url })
}
