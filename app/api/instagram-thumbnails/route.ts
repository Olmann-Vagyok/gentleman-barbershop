import { NextResponse } from 'next/server'
import { getInstagramUrls } from '@/lib/store'

export const dynamic = 'force-dynamic'

async function fetchThumbnail(postUrl: string): Promise<string | null> {
  try {
    const shortcode = postUrl.match(/\/p\/([^/]+)/)?.[1]
    if (!shortcode) return null
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(postUrl)}&meta=false`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.data?.image?.url ?? data?.data?.video?.thumbnailUrl ?? null
  } catch {
    return null
  }
}

export async function GET() {
  const urls = await getInstagramUrls()
  const results = await Promise.all(
    urls.map(async url => {
      const thumbnail = await fetchThumbnail(url)
      return { url, thumbnail }
    })
  )
  return NextResponse.json({ posts: results.filter(r => r.thumbnail) })
}
