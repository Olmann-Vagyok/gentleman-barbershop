import { NextRequest, NextResponse } from 'next/server'
import { BARBERS } from '@/lib/data'
import { google } from 'googleapis'
import { addDays, format, startOfDay } from 'date-fns'

function checkAuth(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  return pw && pw === process.env.ADMIN_PASSWORD
}

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  })
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({ error: 'Google Calendar not configured', bookings: [] })
  }

  try {
    const auth = getAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    const now = startOfDay(new Date())
    const timeMin = now.toISOString()
    const timeMax = addDays(now, 30).toISOString()

    const allBookings: object[] = []

    for (const barber of BARBERS) {
      const calendarId = process.env[barber.calendarEnvKey]
      if (!calendarId) continue

      const { data } = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50,
      })

      for (const event of data.items ?? []) {
        allBookings.push({
          id: event.id,
          barber: barber.name,
          summary: event.summary,
          start: event.start?.dateTime,
          end: event.end?.dateTime,
          description: event.description,
        })
      }
    }

    allBookings.sort((a: any, b: any) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    )

    return NextResponse.json({ bookings: allBookings })
  } catch (err) {
    console.error('Calendar fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch bookings', bookings: [] }, { status: 500 })
  }
}
