'use client'

import { useState, useEffect, useCallback } from 'react'
import { BARBERS, SERVICES, type Barber, type Service } from '@/lib/data'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, isToday, startOfDay } from 'date-fns'

type TimeSlot = { time: string; available: boolean }
type ClientInfo = { name: string; phone: string; email: string; notes: string }
type BookingResult = { success: boolean; eventId?: string; error?: string }

const STEPS = ['სერვისი', 'ბარბერი', 'თარიღი და დრო', 'დეტალები', 'დასრულება']
const today = startOfDay(new Date())

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-7 h-7 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              i < step ? 'bg-gold text-ink' : i === step ? 'border-2 border-gold text-gold' : 'border border-ink-400 text-gray-600'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] tracking-wide uppercase hidden sm:block ${
              i === step ? 'text-gold' : i < step ? 'text-gray-400' : 'text-gray-700'
            }`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-8 sm:w-16 mx-1 transition-all duration-500 ${i < step ? 'bg-gold' : 'bg-ink-400'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function ServiceStep({ selected, onToggle }: { selected: Service[]; onToggle: (s: Service) => void }) {
  const totalPrice = selected.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selected.reduce((sum, s) => sum + s.duration, 0)

  return (
    <div>
      <h3 className="font-serif text-2xl text-white mb-2">აირჩიე სერვისი</h3>
      <p className="text-gray-500 text-sm mb-8">შეგიძლია აირჩიო რამდენიმე სერვისი.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICES.map(service => {
          const isSelected = selected.some(s => s.id === service.id)
          return (
            <button
              key={service.id}
              onClick={() => onToggle(service)}
              className={`select-card text-left p-5 relative ${isSelected ? 'selected' : ''}`}
            >
              {/* Checkmark */}
              <div className={`absolute top-4 right-4 w-5 h-5 border flex items-center justify-center transition-all ${
                isSelected ? 'border-gold bg-gold text-ink' : 'border-ink-400'
              }`}>
                {isSelected && <span className="text-[10px] font-bold">✓</span>}
              </div>
              <div className="flex justify-between items-start mb-2 pr-8">
                <span className="text-white font-medium">{service.name}</span>
                <span className="font-serif text-gold font-bold text-lg ml-4">{service.price} GEL</span>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed mb-3">{service.description}</p>
              <span className="text-[10px] uppercase tracking-widest text-gray-600">{service.duration} წთ</span>
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <div className="mt-6 p-4 border border-gold/20 bg-gold/5 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest uppercase text-gray-500 mb-1">არჩეული სერვისები</p>
            <p className="text-white text-sm">{selected.map(s => s.name).join(' + ')}</p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="font-serif text-2xl text-gold font-bold">{totalPrice} GEL</p>
            <p className="text-xs text-gray-500">{totalDuration} წთ</p>
          </div>
        </div>
      )}
    </div>
  )
}

function BarberStep({ selected, onSelect }: { selected: Barber | null; onSelect: (b: Barber) => void }) {
  return (
    <div>
      <h3 className="font-serif text-2xl text-white mb-2">აირჩიე ბარბერი</h3>
      <p className="text-gray-500 text-sm mb-8">აირჩიე ვისთან გინდა ჯავშანი.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BARBERS.map(barber => (
          <button key={barber.id} onClick={() => onSelect(barber)}
            className={`select-card text-left p-5 ${selected?.id === barber.id ? 'selected' : ''}`}>
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
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(m => subMonths(m, 1))} disabled={isBefore(endOfMonth(month), today)}
          className="text-gray-400 hover:text-white disabled:opacity-20 transition-colors p-1">←</button>
        <span className="text-white text-sm font-medium tracking-wide">{format(month, 'MMMM yyyy')}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))} className="text-gray-400 hover:text-white transition-colors p-1">→</button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {['ორ', 'სამ', 'ოთ', 'ხუ', 'პარ', 'შა', 'კვ'].map(d => (
          <div key={d} className="text-center text-[10px] text-gray-600 tracking-wide py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const isPast = isBefore(startOfDay(day), today)
          const isSelected = selected === format(day, 'yyyy-MM-dd')
          const isT = isToday(day)
          return (
            <button key={day.toISOString()} disabled={isPast} onClick={() => onSelect(format(day, 'yyyy-MM-dd'))}
              className={`aspect-square flex items-center justify-center text-xs transition-all duration-150 ${
                isSelected ? 'bg-gold text-ink font-bold'
                : isT ? 'border border-gold-50 text-gold'
                : isPast ? 'text-gray-700 cursor-not-allowed'
                : 'text-gray-300 hover:bg-ink-300 hover:text-white'
              }`}>
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DateTimeStep({ selectedDate, selectedTime, barberId, serviceDuration, onDateSelect, onTimeSelect }: {
  selectedDate: string; selectedTime: string; barberId: string; serviceDuration: number
  onDateSelect: (d: string) => void; onTimeSelect: (t: string) => void
}) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchSlots = useCallback(async (date: string) => {
    if (!date) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/availability?barberId=${barberId}&date=${date}&duration=${serviceDuration}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setSlots(data.slots)
    } catch {
      setError('ხელმისაწვდომობის ჩატვირთვა ვერ მოხერხდა. სცადე ხელახლა.')
      setSlots([])
    } finally { setLoading(false) }
  }, [barberId, serviceDuration])

  useEffect(() => { if (selectedDate) fetchSlots(selectedDate) }, [selectedDate, fetchSlots])

  return (
    <div>
      <h3 className="font-serif text-2xl text-white mb-2">აირჩიე თარიღი და დრო</h3>
      <p className="text-gray-500 text-sm mb-8">აირჩიე როდის გინდა მოსვლა.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">თარიღის არჩევა</p>
          <CalendarPicker selected={selectedDate} onSelect={onDateSelect} />
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">
            {selectedDate ? `ხელმისაწვდომი დრო – ${format(new Date(selectedDate + 'T12:00:00'), 'EEEE, d MMM')}` : 'ჯერ აირჩიე თარიღი'}
          </p>
          {!selectedDate && (
            <div className="border border-ink-300 bg-ink-200 h-[280px] flex items-center justify-center">
              <span className="text-gray-600 text-sm">← თარიღის ასარჩევად</span>
            </div>
          )}
          {selectedDate && loading && (
            <div className="border border-ink-300 bg-ink-200 h-[280px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500 text-xs">იტვირთება...</span>
              </div>
            </div>
          )}
          {selectedDate && !loading && error && (
            <div className="border border-red-900/50 bg-red-950/20 p-4 text-red-400 text-sm">{error}</div>
          )}
          {selectedDate && !loading && !error && slots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map(slot => (
                <button key={slot.time} disabled={!slot.available} onClick={() => onTimeSelect(slot.time)}
                  className={`time-slot ${!slot.available ? 'unavailable' : ''} ${selectedTime === slot.time ? 'active' : ''}`}>
                  {slot.time}
                </button>
              ))}
            </div>
          )}
          {selectedDate && !loading && !error && slots.length === 0 && (
            <div className="border border-ink-300 bg-ink-200 p-4 text-gray-500 text-sm text-center">
              ამ თარიღისთვის თავისუფალი დრო არ არის.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailsStep({ info, onChange }: { info: ClientInfo; onChange: (field: keyof ClientInfo, value: string) => void }) {
  return (
    <div>
      <h3 className="font-serif text-2xl text-white mb-2">შენი მონაცემები</h3>
      <p className="text-gray-500 text-sm mb-8">ეს გამოვიყენებთ ჩანაწერის დასადასტურებლად.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <div className="flex flex-col gap-2">
          <label className="text-xs tracking-widest uppercase text-gray-500">სახელი და გვარი <span className="text-gold">*</span></label>
          <input type="text" value={info.name} onChange={e => onChange('name', e.target.value)} placeholder="შენი სახელი" className="input-dark px-4 py-3 text-sm w-full" required />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs tracking-widest uppercase text-gray-500">ტელეფონი <span className="text-gold">*</span></label>
          <input type="tel" value={info.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+995 5XX XX XX XX" className="input-dark px-4 py-3 text-sm w-full" required />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-xs tracking-widest uppercase text-gray-500">ელ-ფოსტა</label>
          <input type="email" value={info.email} onChange={e => onChange('email', e.target.value)} placeholder="კალენდრის მოწვევისთვის (სურვილისამებრ)" className="input-dark px-4 py-3 text-sm w-full" />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="text-xs tracking-widest uppercase text-gray-500">შენიშვნები</label>
          <textarea value={info.notes} onChange={e => onChange('notes', e.target.value)} placeholder="განსაკუთრებული სურვილები..." rows={3} className="input-dark px-4 py-3 text-sm w-full resize-none" />
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

function ConfirmStep({ services, barber, date, time, info, result }: {
  services: Service[]; barber: Barber; date: string; time: string; info: ClientInfo; result: BookingResult | null
}) {
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0)
  const serviceNames = services.map(s => s.name).join(' + ')

  if (result?.success) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 border-2 border-gold flex items-center justify-center mx-auto mb-6">
          <span className="text-gold text-2xl">✓</span>
        </div>
        <h3 className="font-serif text-3xl text-white mb-3">ჯავშანი დადასტურებულია</h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto mb-10 leading-relaxed">
          ჩანაწერი დაემატა {barber.name}-ის კალენდარს.
          {info.email && ' ელ-ფოსტაზე გაიგზავნა დასტური.'}
        </p>
        <div className="max-w-xs mx-auto bg-ink-100 border border-ink-300 mb-8">
          <SummaryRow label="სერვისი" value={serviceNames} />
          <SummaryRow label="ბარბერი" value={barber.name} />
          <SummaryRow label="თარიღი" value={format(new Date(date + 'T12:00:00'), 'EEEE, d MMMM yyyy')} />
          <SummaryRow label="დრო" value={`${time} (თბილისი)`} />
          <SummaryRow label="ფასი" value={`${totalPrice} GEL`} />
        </div>
        <p className="text-gray-600 text-xs">
          გაუქმება ან შეცვლა?{' '}
          <a href="tel:+995514400010" className="text-gold hover:text-gold-light transition-colors underline">დაგვიკავშირდი</a>
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-white mb-2">ჯავშნის დადასტურება</h3>
      <p className="text-gray-500 text-sm mb-8">გადახედე ჩანაწერის დეტალებს.</p>
      <div className="max-w-sm bg-ink-200 border border-ink-300">
        <SummaryRow label="სერვისი" value={serviceNames} />
        <SummaryRow label="ბარბერი" value={barber.name} />
        <SummaryRow label="თარიღი" value={format(new Date(date + 'T12:00:00'), 'EEEE, d MMMM yyyy')} />
        <SummaryRow label="დრო" value={`${time} (თბილისი)`} />
        <SummaryRow label="ხანგრძლივობა" value={`${totalDuration} წთ`} />
        <SummaryRow label="ფასი" value={`${totalPrice} GEL`} />
        <SummaryRow label="სახელი" value={info.name} />
        <SummaryRow label="ტელეფონი" value={info.phone} />
        {info.email && <SummaryRow label="ელ-ფოსტა" value={info.email} />}
      </div>
      {result?.error && (
        <div className="mt-4 p-3 border border-red-900/50 bg-red-950/20 text-red-400 text-sm max-w-sm">{result.error}</div>
      )}
    </div>
  )
}

export default function Booking() {
  const [step, setStep] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [barber, setBarber] = useState<Barber | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [info, setInfo] = useState<ClientInfo>({ name: '', phone: '', email: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BookingResult | null>(null)

  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0)
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0)

  function toggleService(s: Service) {
    setServices(prev =>
      prev.some(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]
    )
  }

  const canNext = [
    services.length > 0,
    !!barber,
    !!(date && time),
    !!(info.name.trim() && info.phone.trim()),
  ]

  function handleNext() {
    if (step === 4) return
    if (step === 3) { handleSubmit(); return }
    setStep(s => s + 1)
  }

  function handleBack() {
    if (step === 0) return
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    if (services.length === 0 || !barber) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: barber.id,
          serviceId: services[0].id,
          serviceName: services.map(s => s.name).join(' + '),
          durationMinutes: totalDuration,
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
      const message = err instanceof Error ? err.message : 'შეცდომა. სცადე ხელახლა.'
      setResult({ success: false, error: message })
    } finally { setSubmitting(false) }
  }

  function resetBooking() {
    setStep(0); setServices([]); setBarber(null)
    setDate(''); setTime(''); setInfo({ name: '', phone: '', email: '', notes: '' }); setResult(null)
  }

  return (
    <section id="booking" className="section-padding bg-ink-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="divider-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold">ჯავშნები</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
            დაჯავშნე<br />
            <span className="text-gold-gradient">ვიზიტი</span>
          </h2>
        </div>

        <div className="max-w-4xl">
          <StepIndicator step={step} />

          <div className="min-h-[420px]">
            {step === 0 && <ServiceStep selected={services} onToggle={toggleService} />}
            {step === 1 && <BarberStep selected={barber} onSelect={b => { setBarber(b); setStep(2) }} />}
            {step === 2 && services.length > 0 && barber && (
              <DateTimeStep
                selectedDate={date} selectedTime={time}
                barberId={barber.id} serviceDuration={totalDuration}
                onDateSelect={d => { setDate(d); setTime('') }}
                onTimeSelect={setTime}
              />
            )}
            {step === 3 && <DetailsStep info={info} onChange={(f, v) => setInfo(i => ({ ...i, [f]: v }))} />}
            {step === 4 && services.length > 0 && barber && (
              <ConfirmStep services={services} barber={barber} date={date} time={time} info={info} result={result} />
            )}
          </div>

          {step < 4 && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-ink-300">
              <button onClick={handleBack} disabled={step === 0} className="btn-outline disabled:opacity-20">
                ← უკან
              </button>
              <div className="flex items-center gap-4">
                {services.length > 0 && step > 0 && (
                  <span className="text-gray-600 text-xs hidden sm:block">
                    {services.map(s => s.name).join(' + ')} · {barber?.name ?? '–'} · {totalPrice} GEL
                  </span>
                )}
                <button onClick={handleNext} disabled={!canNext[step] || submitting} className="btn-gold min-w-[140px]">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-ink/40 border-t-ink rounded-full animate-spin" />
                      ჯავშანი...
                    </span>
                  ) : step === 3 ? 'ჯავშნის დასტური' : 'გაგრძელება →'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && result?.success && (
            <div className="mt-10 pt-6 border-t border-ink-300 text-center">
              <button onClick={resetBooking} className="btn-outline">კიდევ ერთი ჯავშანი</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
