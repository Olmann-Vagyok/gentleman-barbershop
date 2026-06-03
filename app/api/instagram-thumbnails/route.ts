import { NextResponse } from 'next/server'
import { getInstagramUrls } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const urls = await getInstagramUrls()
  return NextResponse.json({ urls })
}
