'use client'

import { useState, useEffect, useCallback } from 'react'
import { BARBERS, SERVICES, type Barber, type Service } from '@/lib/data'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, isToday, startOfDay } from 'date-fns'

type TimeSlot = { time: string; available: boolean }
type ClientInfo = { name: string; phone: string; email: string; notes: string }
type BookingResult = { success: boolean; eventId?: string; error?: string }

const STEPS = ['Service', 'Barber', 'Date & Time', 'Details', 'Done']

const today = startOfDay(new Date())

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-7 h-7 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step
                  ? 'bg-gold text-ink'
                  : i === step
                  ? 'border-2 border-gold text-gold'
                  : 'border border-ink-400 text-gray-600'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span
              className={`text-[10px] tracking-wide uppercase hidden sm:block ${
                i === step ? 'text-gold' : i < step ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-8 sm:w-16 mx-1 transition-all duration-500 ${
                i < step ? 'bg-gold' : 'bg-ink-400'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function ServiceStep({
  selected,
  onSelect,
}: {
  selected: Service | null
  onSelect: (s: Service) => void
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl text-white mb-2">Choose Your Service</h3>
      <p className="text-gray-500 text-sm mb-8">Select the service you'd like to book.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICES.map(service => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className={`select-card text-left p-5 ${selected?.id === service.id ? 'selected' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-white font-medium">{service.name}</span>
              <span className="font-serif text-gold font-bold text-lg ml-4">{service.price} GEL</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed mb-3">{service.description}</p>
            <span className="text-[10px] uppercase tracking-widest text-gray-600">{service.duration} min</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function BarberStep({
  selected,
  onSelect,
}: {
  selected: Barber | null
  onSelect: (b: Barber) => void
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl text-white mb-2">Choose Your Barber</h3>
      <p className="text-gray-500 text-sm mb-8">Pick who you'd like to book with.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BARBERS.map(barber => (
          <button
            key={barber.id}
            onClick={() => onSelect(barber)}
            className={`select-card text-left p-5 ${selected?.id === barber.id ? 'selected' : ''}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                <span className="font-serif text-gold font-bold">{barber.name[0]}</span>
              </div>
              <div>
                <div className="text-white font-medium">{barber.name}</div>
                <div className="text-gold text-[10px] tracking-widest uppercase">{barber.title}</div>
              </div>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">{barber.speciality}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function CalendarPicker({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const [month, setMonth] = useState(new Date())

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1

  return (
    <div className="border border-ink-300 bg-ink-200 p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonth(m => subMonths(m, 1))}
          disabled={isBefore(endOfMonth(month), today)}
          className="text-gray-400 hover:text-white disabled:opacity-20 transition-colors p-1"
        >
          ←
        </button>
        <span className="text-white text-sm font-medium tracking-wide">
          {format(month, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setMonth(m => addMonths(m, 1))}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          →
        </button>
      </div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-[10px] text-gray-600 tracking-wide py-1">
            {d}
          </div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map(day => {
          const isPast = isBefore(startOfDay(day), today)
          const isSelected = selected === format(day, 'yyyy-MM-dd')
          const isT = isToday(day)
          return (
            <button
              key={day.toISOString()}
              disabled={isPast}
              onClick={() => onSelect(format(day, 'yyyy-MM-dd'))}
              className={`aspect-square flex items-center justify-center text-xs transition-all duration-150 ${
                isSelected
                  ? 'bg-gold text-ink font-bold'
                  : isT
                  ? 'border border-gold/50 text-gold'
                  : isPast
                  ? 'text-gray-700 cursor-not-allowed'
                  : 'text-gray-300 hover:bg-ink-300 hover:text-white'
              }`}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DateTimeStep({
  selectedDate,
  selectedTime,
  barberId,
  serviceDuration,
  onDateSelect,
  onTimeSelect,
}: {
  selectedDate: string
  selectedTime: string
  barberId: string
  serviceDuration: number
  onDateSelect: (d: string) => void
  onTimeSelect: (t: string) => void
}) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchSlots = useCallback(async (date: string) => {
    if (!date) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/availability?barberId=${barberId}&date=${date}&duration=${serviceDuration}`
      )
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setSlots(data.slots)
    } catch {
      setError('Could not load availability. Please try again.')
      setSlots([])
    } finally {
      setLoading(false)
    }
  }, [barberId, serviceDuration])

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate)
  }, [selectedDate, fetchSlots])

  return (
    <div>
      <h3 className="font-serif text-2xl text-white mb-2">Pick a Date & Time</h3>
      <p className="text-gray-500 text-sm mb-8">Choose when you'd like to come in.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">Select Date</p>
          <CalendarPicker selected={selectedDate} onSelect={onDateSelect} />
        </div>

        {/* Time slots */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">
            {selectedDate
              ? `Available Times — ${format(new Date(selectedDate + 'T12:00:00'), 'EEEE, d MMM')}`
              : 'Select a date first'}
          </p>
          {!selectedDate && (
            <div className="border border-ink-300 bg-ink-200 h-[280px] flex items-center justify-center">
              <span className="text-gray-600 text-sm">← Pick a date</span>
            </div>
          )}
          {selectedDate && loading && (
            <div className="border border-ink-300 bg-ink-200 h-[280px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500 text-xs">Loading availability…</span>
              </div>
            </div>
          )}
          {selectedDate && !loading && error && (
            <div className="border border-red-900/50 bg-red-950/20 p-4 text-red-400 text-sm">
              {error}
            </div>
          )}
          {selectedDate && !loading && !error && slots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map(slot => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => onTimeSelect(slot.time)}
                  className={`time-slot ${!slot.available ? 'unavailable' : ''} ${
                    selectedTime === slot.time ? 'active' : ''
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
          {selectedDate && !loading && !error && slots.length === 0 && (
            <div className="border border-ink-300 bg-ink-200 p-4 text-gray-500 text-sm text-center">
              No slots available for this date.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailsStep({
  info,
  onChange,
}: {
  info: ClientInfo
  onChange: (field: keyof ClientInfo, value: string) => void
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl text-white mb-2">Your Details</h3>
      <p className="text-gray-500 text-sm mb-8">
        We'll use this to confirm your appointment. A calendar invite will be sent to your email.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <div className="flex flex-col gap-2">
          <label className="text-xs tracking-widest uppercase text-gray-500">
            Full Name <span className="text-gold">*</span>
          </label>
          <input
            type="text"
            value={info.name}
            onChange={e => onChange('name', e.target.value)}
            placeholder="Your name"
            className="input-dark px-4 py-3 text-sm w-full"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs tracking-widest uppercase text-gray-500">
            Phone <span className="text-gold">*</span>
          </label>
          <input
            type="tel"
            value={info.phone}
            onChange={e => onChange('phone', e.target.value)}
            placeholder="+995 5XX XX XX XX"
            className="input-dark px-4 py-3 text-sm w-full"
            required
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-xs tracking-widest uppercase text-gray-500">Email</label>
          <input
            type="email"
            value={info.email}
            onChange={e => onChange('email', e.target.value)}
            placeholder="For calendar invite (optional)"
            className="input-dark px-4 py-3 text-sm w-full"
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-xs tracking-widest uppercase text-gray-500">Notes</label>
          <textarea
            value={info.notes}
            onChange={e => onChange('notes', e.target.value)}
            placeholder="Any special requests or preferences…"
            rows={3}
            className="input-dark px-4 py-3 text-sm w-full resize-none"
          />
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-3 border-b border-ink-300">
      <span className="text-gray-500 text-xs tracking-widest uppercase">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}

function ConfirmStep({
  service,
  barber,
  date,
  time,
  info,
  result,
}: {
  service: Service
  barber: Barber
  date: string
  time: string
  info: ClientInfo
  result: BookingResult | null
}) {
  if (result?.success) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 border-2 border-gold flex items-center justify-center mx-auto mb-6">
          <span className="text-gold text-2xl">✓</span>
        </div>
        <h3 className="font-serif text-3xl text-white mb-3">Booking Confirmed</h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto mb-10 leading-relaxed">
          Your appointment has been added to {barber.name}'s calendar.
          {info.email && ' A confirmation has been sent to your email.'}
        </p>
        <div className="max-w-xs mx-auto bg-ink-100 border border-ink-300 mb-8">
          <SummaryRow label="Service" value={service.name} />
          <SummaryRow label="Barber" value={barber.name} />
          <SummaryRow
            label="Date"
            value={format(new Date(date + 'T12:00:00'), 'EEEE, d MMMM yyyy')}
          />
          <SummaryRow label="Time" value={`${time} (Tbilisi)`} />
          <SummaryRow label="Price" value={`${service.price} GEL`} />
        </div>
        <p className="text-gray-600 text-xs">
          Need to cancel or change?{' '}
          <a
            href="tel:+995514400010"
            className="text-gold hover:text-gold-light transition-colors underline"
          >
            Call us
          </a>
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-white mb-2">Confirm Booking</h3>
      <p className="text-gray-500 text-sm mb-8">Review your appointment details below.</p>
      <div className="max-w-sm bg-ink-200 border border-ink-300">
        <SummaryRow label="Service" value={service.name} />
        <SummaryRow label="Barber" value={barber.name} />
        <SummaryRow
          label="Date"
          value={format(new Date(date + 'T12:00:00'), 'EEEE, d MMMM yyyy')}
        />
        <SummaryRow label="Time" value={`${time} (Tbilisi)`} />
        <SummaryRow label="Duration" value={`${service.duration} min`} />
        <SummaryRow label="Price" value={`${service.price} GEL`} />
        <SummaryRow label="Name" value={info.name} />
        <SummaryRow label="Phone" value={info.phone} />
        {info.email && <SummaryRow label="Email" value={info.email} />}
      </div>
      {result?.error && (
        <div className="mt-4 p-3 border border-red-900/50 bg-red-950/20 text-red-400 text-sm max-w-sm">
          {result.error}
        </div>
      )}
    </div>
  )
}

export default function Booking() {
  const [step, setStep] = useState(0)
  const [service, setService] = useState<Service | null>(null)
  const [barber, setBarber] = useState<Barber | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [info, setInfo] = useState<ClientInfo>({ name: '', phone: '', email: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BookingResult | null>(null)

  const canNext = [
    !!service,
    !!barber,
    !!(date && time),
    !!(info.name.trim() && info.phone.trim()),
  ]

  function handleNext() {
    if (step === 4) return
    if (step === 3) {
      handleSubmit()
      return
    }
    setStep(s => s + 1)
  }

  function handleBack() {
    if (step === 0) return
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    if (!service || !barber) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: barber.id,
          serviceId: service.id,
          serviceName: service.name,
          durationMinutes: service.duration,
          date,
          time,
          clientName: info.name,
          clientPhone: info.phone,
          clientEmail: info.email || undefined,
          clientNotes: info.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      setResult({ success: true, eventId: data.eventId })
      setStep(4)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setResult({ success: false, error: message })
    } finally {
      setSubmitting(false)
    }
  }

  function resetBooking() {
    setStep(0)
    setService(null)
    setBarber(null)
    setDate('')
    setTime('')
    setInfo({ name: '', phone: '', email: '', notes: '' })
    setResult(null)
  }

  return (
    <section id="booking" className="section-padding bg-ink-100">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="divider-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Reservations</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
            Book Your
            <br />
            <span className="text-gold-gradient">Appointment</span>
          </h2>
        </div>

        <div className="max-w-4xl">
          <StepIndicator step={step} />

          {/* Step content */}
          <div className="min-h-[420px]">
            {step === 0 && (
              <ServiceStep selected={service} onSelect={s => { setService(s); setStep(1) }} />
            )}
            {step === 1 && (
              <BarberStep selected={barber} onSelect={b => { setBarber(b); setStep(2) }} />
            )}
            {step === 2 && service && barber && (
              <DateTimeStep
                selectedDate={date}
                selectedTime={time}
                barberId={barber.id}
                serviceDuration={service.duration}
                onDateSelect={d => { setDate(d); setTime('') }}
                onTimeSelect={setTime}
              />
            )}
            {step === 3 && (
              <DetailsStep info={info} onChange={(f, v) => setInfo(i => ({ ...i, [f]: v }))} />
            )}
            {step === 4 && service && barber && (
              <ConfirmStep
                service={service}
                barber={barber}
                date={date}
                time={time}
                info={info}
                result={result}
              />
            )}
          </div>

          {/* Navigation */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-ink-300">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className="btn-outline disabled:opacity-20"
              >
                ← Back
              </button>
              <div className="flex items-center gap-4">
                {service && step > 0 && (
                  <span className="text-gray-600 text-xs hidden sm:block">
                    {service.name} · {barber?.name ?? '—'} · {service.price} GEL
                  </span>
                )}
                <button
                  onClick={handleNext}
                  disabled={!canNext[step] || submitting}
                  className="btn-gold min-w-[140px]"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-ink/40 border-t-ink rounded-full animate-spin" />
                      Booking…
                    </span>
                  ) : step === 3 ? (
                    'Confirm Booking'
                  ) : (
                    'Continue →'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* New booking button after success */}
          {step === 4 && result?.success && (
            <div className="mt-10 pt-6 border-t border-ink-300 text-center">
              <button onClick={resetBooking} className="btn-outline">
                Book Another Appointment
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
