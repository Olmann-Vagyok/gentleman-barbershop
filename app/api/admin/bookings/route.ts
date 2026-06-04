import { NextRequest, NextResponse } from 'next/server'
import { BARBERS } from '@/lib/data'
import { authFromRequest } from '@/lib/auth'
import { google } from 'googleapis'
import { addDays, startOfDay } from 'date-fns'

function getGoogleAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  })
}

export async function GET(req: NextRequest) {
  const session = await authFromRequest(req)
  if (!session.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({ error: 'Google Calendar not configured', bookings: [] })
  }

  const barbersToFetch =
    session.role === 'barber'
      ? BARBERS.filter(b => b.id === session.barberId)
      : BARBERS

  try {
    const auth     = getGoogleAuth()
    const calendar = google.calendar({ version: 'v3', auth })
    const now      = startOfDay(new Date())
    const timeMin  = now.toISOString()
    const timeMax  = addDays(now, 60).toISOString()

    const allBookings: object[] = []

    for (const barber of barbersToFetch) {
      const calendarId = process.env[barber.calendarEnvKey]
      if (!calendarId) continue

      const { data } = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100,
      })

      for (const event of data.items ?? []) {
        if (!event.start?.dateTime) continue
        allBookings.push({
          id:          event.id,
          barberId:    barber.id,
          barber:      barber.name,
          summary:     event.summary ?? '',
          start:       event.start.dateTime,
          end:         event.end?.dateTime,
          description: event.description ?? '',
        })
      }
    }

    allBookings.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
    return NextResponse.json({ bookings: allBookings })
  } catch (err) {
    console.error('Calendar fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch bookings', bookings: [] }, { status: 500 })
  }
}
