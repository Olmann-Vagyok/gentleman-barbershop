import { NextRequest, NextResponse } from 'next/server'
import { BARBERS } from '@/lib/data'
import { google } from 'googleapis'

function checkAuth(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  const bp = req.headers.get('x-barber-password')
  return (pw && pw === process.env.ADMIN_PASSWORD) || !!bp
}

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { barberId, date, startTime, endTime, title } = await req.json()

  const barber = BARBERS.find(b => b.id === barberId)
  if (!barber) return NextResponse.json({ error: 'Barber not found' }, { status: 404 })

  const calendarId = process.env[barber.calendarEnvKey]
  if (!calendarId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({ error: 'Calendar not configured' }, { status: 500 })
  }

  try {
    const auth = getAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    const start = startTime
      ? new Date(`${date}T${startTime}:00+04:00`)
      : new Date(`${date}T00:00:00+04:00`)
    const end = endTime
      ? new Date(`${date}T${endTime}:00+04:00`)
      : new Date(`${date}T23:59:59+04:00`)

    await calendar.events.insert({
      calendarId,
      sendUpdates: 'none',
      requestBody: {
        summary: title || '🚫 დაკავებულია',
        start: startTime ? { dateTime: start.toISOString(), timeZone: 'Asia/Tbilisi' } : { date },
        end: endTime ? { dateTime: end.toISOString(), timeZone: 'Asia/Tbilisi' } : { date },
        transparency: 'opaque',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Block error:', err)
    return NextResponse.json({ error: 'Failed to block time' }, { status: 500 })
  }
}
