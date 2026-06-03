'use client'

import { useState, useEffect, useCallback } from 'react'

type Service = { id: string; name: string; duration: number; price: number; description: string }
type Barber = { id: string; name: string; title: string; experience: string; speciality: string; bio: string; calendarEnvKey: string }
type ShopInfo = { name: string; tagline: string; address: string; city: string; phone: string; email: string; instagram: string; facebook: string; hours: string; metro: string; mapUrl: string; rating: string; reviews: string }
type Booking = { id: string; barber: string; summary: string; start: string; end: string; description: string }

type Tab = 'bookings' | 'services' | 'barbers' | 'shop'

const GOLD = '#C9A84C'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<Tab>('bookings')

  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsError, setBookingsError] = useState('')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const storedPw = typeof window !== 'undefined' ? localStorage.getItem('admin_pw') ?? '' : ''

  useEffect(() => {
    const saved = localStorage.getItem('admin_pw')
    if (saved) tryLogin(saved)
  }, [])

  async function tryLogin(pw: string) {
    setLoading(true)
    setAuthError('')
    const res = await fetch('/api/admin/data', { headers: { 'x-admin-password': pw } })
    if (res.ok) {
      const data = await res.json()
      setServices(data.services)
      setBarbers(data.barbers)
      setShopInfo(data.shopInfo)
      localStorage.setItem('admin_pw', pw)
      setAuthed(true)
    } else {
      setAuthError('პაროლი არასწორია')
      localStorage.removeItem('admin_pw')
    }
    setLoading(false)
  }

  const loadBookings = useCallback(async () => {
    const pw = localStorage.getItem('admin_pw') ?? ''
    const res = await fetch('/api/admin/bookings', { headers: { 'x-admin-password': pw } })
    const data = await res.json()
    if (data.error && data.error !== 'Google Calendar not configured') setBookingsError(data.error)
    setBookings(data.bookings ?? [])
  }, [])

  useEffect(() => {
    if (authed && tab === 'bookings') loadBookings()
  }, [authed, tab, loadBookings])

  async function save(type: string, data: unknown) {
    setSaving(true)
    setSaveMsg('')
    const pw = localStorage.getItem('admin_pw') ?? ''
    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify({ type, data }),
    })
    if (res.ok) {
      setSaveMsg('შენახულია ✓')
    } else {
      const err = await res.json()
      setSaveMsg(err.error ?? 'შეცდომა')
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  function updateService(i: number, field: keyof Service, value: string | number) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function updateBarber(i: number, field: keyof Barber, value: string) {
    setBarbers(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b))
  }

  function updateShop(field: keyof ShopInfo, value: string) {
    setShopInfo(prev => prev ? { ...prev, [field]: value } : prev)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10 justify-center">
            <span className="w-8 h-8 border border-[#C9A84C] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#C9A84C" strokeWidth="1.2" />
              </svg>
            </span>
            <span className="font-serif text-white text-lg tracking-widest uppercase">Admin</span>
          </div>
          <div className="border border-[#2a2a2a] bg-[#141414] p-8">
            <p className="text-xs tracking-widest uppercase text-gray-500 mb-6">შედი სისტემაში</p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tryLogin(password)}
              placeholder="პაროლი"
              className="w-full bg-[#0D0D0D] border border-[#2a2a2a] text-white px-4 py-3 text-sm outline-none focus:border-[#C9A84C] transition-colors mb-4"
            />
            {authError && <p className="text-red-400 text-xs mb-4">{authError}</p>}
            <button
              onClick={() => tryLogin(password)}
              disabled={loading}
              className="w-full py-3 bg-[#C9A84C] text-[#0D0D0D] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors disabled:opacity-50"
            >
              {loading ? 'იტვირთება...' : 'შესვლა'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'bookings', label: 'ჯავშნები' },
    { id: 'services', label: 'სერვისები' },
    { id: 'barbers', label: 'ბარბერები' },
    { id: 'shop', label: 'სალონი' },
  ]

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 border border-[#C9A84C] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#C9A84C" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="font-serif text-white tracking-widest uppercase text-sm">Gentleman Admin</span>
        </div>
        <div className="flex items-center gap-4">
          {saveMsg && (
            <span className={`text-xs ${saveMsg.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMsg}
            </span>
          )}
          <a href="/" target="_blank" className="text-xs text-gray-500 hover:text-white tracking-widest uppercase transition-colors">
            საიტი →
          </a>
          <button
            onClick={() => { localStorage.removeItem('admin_pw'); setAuthed(false) }}
            className="text-xs text-gray-500 hover:text-white tracking-widest uppercase transition-colors"
          >
            გასვლა
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-[#2a2a2a] px-6 flex gap-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-4 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-[#C9A84C] text-[#C9A84C]'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* BOOKINGS TAB */}
        {tab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl text-white">მომავალი ჯავშნები</h2>
              <button onClick={loadBookings} className="text-xs tracking-widest uppercase text-gray-500 hover:text-white transition-colors">
                განახლება ↺
              </button>
            </div>
            {bookingsError && (
              <div className="border border-red-900/50 bg-red-950/20 p-4 text-red-400 text-sm mb-6">
                {bookingsError}
              </div>
            )}
            {bookings.length === 0 ? (
              <div className="border border-[#2a2a2a] bg-[#141414] p-8 text-center">
                <p className="text-gray-500 text-sm">
                  {!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
                    ? 'Google Calendar არ არის დაკავშირებული. დააყენე env ცვლადები Vercel-ში.'
                    : 'მომდევნო 30 დღეში ჯავშანი არ არის.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {bookings.map((b: Booking) => (
                  <div key={b.id} className="border border-[#2a2a2a] bg-[#141414] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-white font-medium">{b.summary}</p>
                      <p className="text-[#C9A84C] text-xs tracking-widest uppercase mt-1">{b.barber}</p>
                      {b.description && (
                        <p className="text-gray-500 text-xs mt-2 whitespace-pre-line leading-relaxed">{b.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white text-sm font-medium">
                        {new Date(b.start).toLocaleDateString('ka-GE', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(b.start).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(b.end).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SERVICES TAB */}
        {tab === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl text-white">სერვისები</h2>
              <button
                onClick={() => save('services', services)}
                disabled={saving}
                className="px-6 py-2 bg-[#C9A84C] text-[#0D0D0D] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors disabled:opacity-50"
              >
                {saving ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {services.map((s, i) => (
                <div key={s.id} className="border border-[#2a2a2a] bg-[#141414] p-6">
                  <p className="text-[#C9A84C] text-[10px] tracking-widest uppercase mb-4">{s.id}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="სახელი" value={s.name} onChange={v => updateService(i, 'name', v)} />
                    <Field label="აღწერა" value={s.description} onChange={v => updateService(i, 'description', v)} />
                    <Field label="ფასი (GEL)" value={String(s.price)} onChange={v => updateService(i, 'price', Number(v))} type="number" />
                    <Field label="ხანგრძლივობა (წთ)" value={String(s.duration)} onChange={v => updateService(i, 'duration', Number(v))} type="number" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BARBERS TAB */}
        {tab === 'barbers' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl text-white">ბარბერები</h2>
              <button
                onClick={() => save('barbers', barbers)}
                disabled={saving}
                className="px-6 py-2 bg-[#C9A84C] text-[#0D0D0D] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors disabled:opacity-50"
              >
                {saving ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {barbers.map((b, i) => (
                <div key={b.id} className="border border-[#2a2a2a] bg-[#141414] p-6">
                  <p className="text-[#C9A84C] text-[10px] tracking-widest uppercase mb-4">{b.name}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="სახელი" value={b.name} onChange={v => updateBarber(i, 'name', v)} />
                    <Field label="თანამდებობა" value={b.title} onChange={v => updateBarber(i, 'title', v)} />
                    <Field label="გამოცდილება" value={b.experience} onChange={v => updateBarber(i, 'experience', v)} />
                    <Field label="სპეციალობა" value={b.speciality} onChange={v => updateBarber(i, 'speciality', v)} />
                    <div className="sm:col-span-2">
                      <Field label="ბიოგრაფია" value={b.bio} onChange={v => updateBarber(i, 'bio', v)} multiline />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHOP TAB */}
        {tab === 'shop' && shopInfo && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl text-white">სალონის ინფო</h2>
              <button
                onClick={() => save('shopInfo', shopInfo)}
                disabled={saving}
                className="px-6 py-2 bg-[#C9A84C] text-[#0D0D0D] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors disabled:opacity-50"
              >
                {saving ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
            <div className="border border-[#2a2a2a] bg-[#141414] p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="სახელი" value={shopInfo.name} onChange={v => updateShop('name', v)} />
                <Field label="სლოგანი" value={shopInfo.tagline} onChange={v => updateShop('tagline', v)} />
                <Field label="მისამართი" value={shopInfo.address} onChange={v => updateShop('address', v)} />
                <Field label="ქალაქი" value={shopInfo.city} onChange={v => updateShop('city', v)} />
                <Field label="ტელეფონი" value={shopInfo.phone} onChange={v => updateShop('phone', v)} />
                <Field label="ელ-ფოსტა" value={shopInfo.email} onChange={v => updateShop('email', v)} />
                <Field label="სამუშაო საათები" value={shopInfo.hours} onChange={v => updateShop('hours', v)} />
                <Field label="მეტრო" value={shopInfo.metro} onChange={v => updateShop('metro', v)} />
                <Field label="შეფასება" value={shopInfo.rating} onChange={v => updateShop('rating', v)} />
                <Field label="მიმოხილვები" value={shopInfo.reviews} onChange={v => updateShop('reviews', v)} />
                <Field label="Instagram URL" value={shopInfo.instagram} onChange={v => updateShop('instagram', v)} />
                <Field label="Facebook URL" value={shopInfo.facebook} onChange={v => updateShop('facebook', v)} />
                <div className="sm:col-span-2">
                  <Field label="რუკის URL" value={shopInfo.mapUrl} onChange={v => updateShop('mapUrl', v)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  multiline?: boolean
}) {
  const cls = 'w-full bg-[#0D0D0D] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C] transition-colors'
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] tracking-widest uppercase text-gray-500">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={`${cls} resize-none`} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} />
      )}
    </div>
  )
}
