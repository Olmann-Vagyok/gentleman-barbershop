'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Service = { id: string; name: string; duration: number; price: number; description: string }
type Barber = { id: string; name: string; title: string; experience: string; speciality: string; bio: string; calendarEnvKey: string }
type ShopInfo = { name: string; tagline: string; address: string; city: string; phone: string; email: string; instagram: string; facebook: string; hours: string; metro: string; mapUrl: string; rating: string; reviews: string }
type Booking = { id: string; barber: string; summary: string; start: string; end: string; description: string }
type Photo = { id: string; url: string; type: 'gallery' | 'before-after' | 'featured'; barberId?: string; caption?: string; beforeUrl?: string; afterUrl?: string; createdAt: number }
type Tab = 'dashboard' | 'bookings' | 'services' | 'barbers' | 'shop' | 'gallery'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<Tab>('dashboard')
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsError, setBookingsError] = useState('')
  const [calendarNotConfigured, setCalendarNotConfigured] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [igUrls, setIgUrls] = useState<string[]>([])
  const [igInput, setIgInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    if (data.error === 'Google Calendar not configured') setCalendarNotConfigured(true)
    else if (data.error) setBookingsError(data.error)
    setBookings(data.bookings ?? [])
  }, [])

  const loadPhotos = useCallback(async () => {
    const pw = localStorage.getItem('admin_pw') ?? ''
    const res = await fetch('/api/admin/photos', { headers: { 'x-admin-password': pw } })
    const data = await res.json()
    setPhotos(data.photos ?? [])
  }, [])

  const loadIgUrls = useCallback(async () => {
    const pw = localStorage.getItem('admin_pw') ?? ''
    const res = await fetch('/api/admin/instagram', { headers: { 'x-admin-password': pw } })
    const data = await res.json()
    setIgUrls(data.urls ?? [])
  }, [])

  async function addIgUrl() {
    if (!igInput.trim()) return
    const pw = localStorage.getItem('admin_pw') ?? ''
    await fetch('/api/admin/instagram', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify({ url: igInput }) })
    setIgInput('')
    await loadIgUrls()
  }

  async function deleteIgUrl(url: string) {
    const pw = localStorage.getItem('admin_pw') ?? ''
    await fetch('/api/admin/instagram', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify({ url }) })
    setIgUrls(prev => prev.filter(u => u !== url))
  }

  useEffect(() => {
    if (authed) { loadBookings(); loadPhotos(); loadIgUrls() }
  }, [authed, loadBookings, loadPhotos, loadIgUrls])

  async function uploadPhoto(file: File, meta: Omit<Photo, 'id' | 'url' | 'createdAt'>) {
    setUploading(true)
    const pw = localStorage.getItem('admin_pw') ?? ''
    const form = new FormData()
    form.append('file', file)
    const upRes = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-password': pw }, body: form })
    if (!upRes.ok) { setUploading(false); setSaveMsg('ატვირთვა ვერ მოხერხდა'); setTimeout(() => setSaveMsg(''), 3000); return }
    const { url } = await upRes.json()
    const photo: Photo = { ...meta, id: Date.now().toString(), url, createdAt: Date.now() }
    await fetch('/api/admin/photos', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify(photo) })
    await loadPhotos()
    setUploading(false)
    setSaveMsg('ატვირთულია ✓')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function deletePhoto(id: string) {
    const pw = localStorage.getItem('admin_pw') ?? ''
    await fetch('/api/admin/photos', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify({ id }) })
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  async function save(type: string, data: unknown) {
    const pw = localStorage.getItem('admin_pw') ?? ''
    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify({ type, data }),
    })
    if (res.ok) {
      setSaveMsg('შენახულია ✓')
    } else {
      setSaveMsg('შეცდომა შენახვისას')
    }
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const today = new Date().toDateString()
  const todayBookings = bookings.filter(b => new Date(b.start).toDateString() === today)
  const weekBookings = bookings.filter(b => {
    const d = new Date(b.start)
    const now = new Date()
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return d >= now && d <= week
  })
  const nextBooking = bookings.find(b => new Date(b.start) > new Date())

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-xs">
          <div className="flex items-center gap-3 mb-12 justify-center">
            <span className="w-9 h-9 border border-[#C9A84C] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#C9A84C" strokeWidth="1.2" />
              </svg>
            </span>
            <span className="font-serif text-white text-xl tracking-widest uppercase">Gentleman</span>
          </div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 mb-3 text-center">ადმინ პანელი</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryLogin(password)}
            placeholder="პაროლი"
            autoFocus
            className="w-full bg-[#141414] border border-[#222] text-white px-4 py-3.5 text-sm outline-none focus:border-[#C9A84C] transition-colors mb-3 tracking-wide"
          />
          {authError && <p className="text-red-400 text-xs mb-3 text-center">{authError}</p>}
          <button
            onClick={() => tryLogin(password)}
            disabled={loading}
            className="w-full py-3.5 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#b8953d] transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'შესვლა'}
          </button>
        </div>
      </div>
    )
  }

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'მთავარი', icon: '◈' },
    { id: 'bookings', label: 'ჯავშნები', icon: '◇' },
    { id: 'services', label: 'სერვისები', icon: '✦' },
    { id: 'barbers', label: 'ბარბერები', icon: '◆' },
    { id: 'gallery', label: 'გალერეა', icon: '◻' },
    { id: 'shop', label: 'სალონი', icon: '◉' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-56 bg-[#0f0f0f] border-r border-[#1a1a1a] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 border border-[#C9A84C] flex items-center justify-center shrink-0">
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#C9A84C" strokeWidth="1.2" />
              </svg>
            </span>
            <span className="font-serif text-white tracking-widest uppercase text-sm">Admin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false) }}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm w-full text-left transition-colors rounded-sm ${
                tab === item.id
                  ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="tracking-wide">{item.label}</span>
              {item.id === 'bookings' && todayBookings.length > 0 && (
                <span className="ml-auto bg-[#C9A84C] text-[#0a0a0a] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {todayBookings.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-[#1a1a1a] flex flex-col gap-2">
          {saveMsg && (
            <p className={`text-[10px] text-center tracking-wide px-3 py-1 ${saveMsg.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMsg}
            </p>
          )}
          <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-white transition-colors">
            <span>↗</span> საიტი
          </a>
          <button
            onClick={() => { localStorage.removeItem('admin_pw'); setAuthed(false) }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-red-400 transition-colors"
          >
            <span>→</span> გასვლა
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-4 px-4 py-4 border-b border-[#1a1a1a]">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            ☰
          </button>
          <span className="text-sm text-gray-400">{navItems.find(n => n.id === tab)?.label}</span>
        </div>

        <div className="flex-1 p-6 md:p-8 max-w-5xl w-full">

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <div>
              <h1 className="font-serif text-3xl text-white mb-2">გამარჯობა 👋</h1>
              <p className="text-gray-500 text-sm mb-10">Gentleman Barbershop — ადმინ პანელი</p>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'დღეს', value: todayBookings.length, sub: 'ჯავშანი' },
                  { label: 'ამ კვირაში', value: weekBookings.length, sub: 'ჯავშანი' },
                  { label: 'მომავალი 30 დღე', value: bookings.length, sub: 'სულ' },
                  { label: 'სერვისები', value: services.length, sub: 'სახეობა' },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#141414] border border-[#1e1e1e] p-5">
                    <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">{stat.label}</p>
                    <p className="font-serif text-4xl text-white font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-600 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Next booking */}
              {nextBooking && (
                <div className="mb-10">
                  <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">შემდეგი ჯავშანი</p>
                  <BookingCard booking={nextBooking} highlight />
                </div>
              )}

              {/* Today's bookings */}
              {todayBookings.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">დღევანდელი ჯავშნები</p>
                  <div className="flex flex-col gap-3">
                    {todayBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                  </div>
                </div>
              )}

              {todayBookings.length === 0 && !nextBooking && (
                <div className="bg-[#141414] border border-[#1e1e1e] p-8 text-center">
                  <p className="text-gray-600 text-sm">დღეს ჯავშანი არ არის</p>
                </div>
              )}
            </div>
          )}

          {/* BOOKINGS */}
          {tab === 'bookings' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">ჯავშნები</h1>
                  <p className="text-gray-600 text-sm">მომავალი 30 დღე</p>
                </div>
                <button onClick={loadBookings} className="text-xs tracking-widest uppercase text-gray-500 hover:text-white transition-colors border border-[#1e1e1e] px-4 py-2">
                  განახლება ↺
                </button>
              </div>

              {bookingsError && (
                <div className="border border-red-900/30 bg-red-950/10 p-4 text-red-400 text-sm mb-6 rounded">
                  {bookingsError}
                </div>
              )}

              {calendarNotConfigured && (
                <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-6 text-center mb-6">
                  <p className="text-[#C9A84C] text-sm">Google Calendar არ არის დაკავშირებული</p>
                  <p className="text-gray-600 text-xs mt-1">დააყენე env ცვლადები Vercel-ში</p>
                </div>
              )}

              {bookings.length === 0 && !calendarNotConfigured ? (
                <div className="bg-[#141414] border border-[#1e1e1e] p-12 text-center">
                  <p className="text-gray-600">მომდევნო 30 დღეში ჯავშანი არ არის</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {bookings.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              )}
            </div>
          )}

          {/* SERVICES */}
          {tab === 'services' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">სერვისები</h1>
                  <p className="text-gray-600 text-sm">დააჭირე ველს შესაცვლელად</p>
                </div>
                <button
                  onClick={() => save('services', services)}
                  className="text-xs tracking-widest uppercase text-[#0a0a0a] bg-[#C9A84C] hover:bg-[#b8953d] transition-colors px-5 py-2.5 font-bold"
                >
                  შენახვა
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {services.map((s, i) => (
                  <div key={s.id} className="bg-[#141414] border border-[#1e1e1e] p-6 hover:border-[#2a2a2a] transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <InlineEdit
                        value={s.name}
                        onChange={v => setServices(prev => prev.map((x, idx) => idx === i ? { ...x, name: v } : x))}
                        className="text-white font-semibold text-lg"
                      />
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1">
                          <InlineEdit
                            value={String(s.price)}
                            onChange={v => setServices(prev => prev.map((x, idx) => idx === i ? { ...x, price: Number(v) || x.price } : x))}
                            className="text-[#C9A84C] font-serif text-2xl font-bold w-16 text-right"
                            type="number"
                          />
                          <span className="text-gray-500 text-sm">GEL</span>
                        </div>
                      </div>
                    </div>
                    <InlineEdit
                      value={s.description}
                      onChange={v => setServices(prev => prev.map((x, idx) => idx === i ? { ...x, description: v } : x))}
                      className="text-gray-500 text-sm leading-relaxed mb-3"
                    />
                    <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-gray-600">
                      <InlineEdit
                        value={String(s.duration)}
                        onChange={v => setServices(prev => prev.map((x, idx) => idx === i ? { ...x, duration: Number(v) || x.duration } : x))}
                        className="text-gray-600 w-10"
                        type="number"
                      />
                      <span>წუთი</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BARBERS */}
          {tab === 'barbers' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">ბარბერები</h1>
                  <p className="text-gray-600 text-sm">დააჭირე ველს შესაცვლელად</p>
                </div>
                <button
                  onClick={() => save('barbers', barbers)}
                  className="text-xs tracking-widest uppercase text-[#0a0a0a] bg-[#C9A84C] hover:bg-[#b8953d] transition-colors px-5 py-2.5 font-bold"
                >
                  შენახვა
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {barbers.map((b, i) => (
                  <div key={b.id} className="bg-[#141414] border border-[#1e1e1e] p-6 hover:border-[#2a2a2a] transition-colors">
                    <div className="flex items-start gap-5">
                      {/* Avatar */}
                      <div className="w-14 h-14 border border-[#C9A84C]/30 flex items-center justify-center shrink-0 bg-[#1a1a1a]">
                        <span className="font-serif text-2xl text-[#C9A84C]/70">{b.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <InlineEdit
                            value={b.name}
                            onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, name: v } : x))}
                            className="text-white font-semibold text-lg"
                          />
                          <InlineEdit
                            value={b.title}
                            onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, title: v } : x))}
                            className="text-[#C9A84C] text-[10px] tracking-widest uppercase"
                          />
                        </div>
                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                          <InlineEdit
                            value={b.experience}
                            onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, experience: v } : x))}
                            className="text-gray-600 text-xs"
                          />
                          <span className="text-gray-700 text-xs">·</span>
                          <InlineEdit
                            value={b.speciality}
                            onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, speciality: v } : x))}
                            className="text-gray-500 text-xs"
                          />
                        </div>
                        <InlineEdit
                          value={b.bio}
                          onChange={v => setBarbers(prev => prev.map((x, idx) => idx === i ? { ...x, bio: v } : x))}
                          className="text-gray-600 text-xs leading-relaxed"
                          multiline
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GALLERY */}
          {tab === 'gallery' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">გალერეა</h1>
                  <p className="text-gray-600 text-sm">ატვირთე ფოტოები პორტფოლიოში</p>
                </div>
              </div>
              <GalleryUpload barbers={barbers} onUpload={uploadPhoto} uploading={uploading} />
              {/* Instagram URLs */}
              <div className="mt-8 bg-[#141414] border border-[#1e1e1e] p-6">
                <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">Instagram პოსტები</p>
                <div className="flex gap-2 mb-4">
                  <input
                    value={igInput}
                    onChange={e => setIgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addIgUrl()}
                    placeholder="https://www.instagram.com/p/..."
                    className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
                  />
                  <button onClick={addIgUrl} className="px-4 py-2 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors">
                    დამატება
                  </button>
                </div>
                {igUrls.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {igUrls.map(url => (
                      <div key={url} className="flex items-center justify-between gap-3 py-2 border-b border-[#1e1e1e]">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-white truncate">{url}</a>
                        <button onClick={() => deleteIgUrl(url)} className="text-red-400 text-xs hover:text-red-300 shrink-0">წაშლა ✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {photos.length > 0 && (
                <div className="mt-10">
                  <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-4">ატვირთული ({photos.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map(p => (
                      <div key={p.id} className="relative group aspect-square overflow-hidden bg-[#141414] border border-[#1e1e1e]">
                        <img src={p.url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <span className="text-[10px] tracking-widest uppercase text-[#C9A84C] bg-black/50 px-2 py-0.5">{p.type}</span>
                          {p.caption && <span className="text-[10px] text-white text-center">{p.caption}</span>}
                          <button onClick={() => deletePhoto(p.id)} className="text-red-400 text-xs hover:text-red-300 mt-1">წაშლა ✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SHOP */}
          {tab === 'shop' && shopInfo && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-serif text-3xl text-white mb-1">სალონის ინფო</h1>
                  <p className="text-gray-600 text-sm">დააჭირე ველს შესაცვლელად</p>
                </div>
                <button
                  onClick={() => save('shopInfo', shopInfo)}
                  className="text-xs tracking-widest uppercase text-[#0a0a0a] bg-[#C9A84C] hover:bg-[#b8953d] transition-colors px-5 py-2.5 font-bold"
                >
                  შენახვა
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.entries(shopInfo) as [keyof ShopInfo, string][]).map(([key, val]) => (
                  <div key={key} className="bg-[#141414] border border-[#1e1e1e] p-5 hover:border-[#2a2a2a] transition-colors">
                    <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">{key}</p>
                    <InlineEdit
                      value={val}
                      onChange={v => setShopInfo(prev => prev ? { ...prev, [key]: v } : prev)}
                      className="text-white text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

function BookingCard({ booking, highlight = false }: { booking: Booking; highlight?: boolean }) {
  const start = new Date(booking.start)
  const end = new Date(booking.end)
  const isToday = start.toDateString() === new Date().toDateString()

  return (
    <div className={`border p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-colors ${
      highlight
        ? 'border-[#C9A84C]/30 bg-[#C9A84C]/5'
        : isToday
        ? 'border-[#2a2a2a] bg-[#141414]'
        : 'border-[#1a1a1a] bg-[#111]'
    }`}>
      {/* Time column */}
      <div className="shrink-0 text-right sm:w-28">
        <p className="text-white font-semibold text-sm">
          {start.toLocaleDateString('ka-GE', { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
        <p className="text-[#C9A84C] text-xs mt-0.5 font-mono">
          {start.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
          {' – '}
          {end.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {isToday && (
          <span className="inline-block mt-1 text-[10px] tracking-widest uppercase text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5">
            დღეს
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px bg-[#1e1e1e] self-stretch" />

      {/* Info */}
      <div className="flex-1">
        <p className="text-white font-medium text-base">{booking.summary}</p>
        <p className="text-[#C9A84C] text-[10px] tracking-widest uppercase mt-0.5 mb-2">{booking.barber}</p>
        {booking.description && (
          <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{booking.description}</p>
        )}
      </div>
    </div>
  )
}

function InlineEdit({
  value,
  onChange,
  className = '',
  type = 'text',
  multiline = false,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  type?: string
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  function commit() {
    setEditing(false)
    onChange(draft)
  }

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={`cursor-text hover:bg-white/5 rounded px-1 -mx-1 py-0.5 transition-colors block ${className}`}
        title="დასაჭერია შესასწორებლად"
      >
        {value || <span className="text-gray-700 italic text-xs">დააჭირე შესაცვლელად</span>}
      </span>
    )
  }

  const inputCls = `bg-[#0a0a0a] border border-[#C9A84C]/50 outline-none rounded px-1 -mx-1 py-0.5 w-full ${className}`

  return multiline ? (
    <textarea
      ref={ref as React.RefObject<HTMLTextAreaElement>}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Escape' && setEditing(false)}
      rows={3}
      className={`${inputCls} resize-none`}
    />
  ) : (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      type={type}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      className={inputCls}
    />
  )
}

type BarberMin = { id: string; name: string }

function GalleryUpload({ barbers, onUpload, uploading }: {
  barbers: BarberMin[]
  onUpload: (file: File, meta: any) => void
  uploading: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [type, setType] = useState<'gallery' | 'before-after' | 'featured'>('gallery')
  const [barberId, setBarberId] = useState('')
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState('')

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    if (!file) return
    onUpload(file, { type, barberId: barberId || undefined, caption: caption || undefined })
    setFile(null); setBeforeFile(null); setPreview(''); setCaption('')
  }

  return (
    <div className="bg-[#141414] border border-[#1e1e1e] p-6">
      <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-5">ახალი ფოტო</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Type */}
        <div>
          <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">ტიპი</p>
          <div className="flex gap-2">
            {(['gallery', 'before-after', 'featured'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1.5 text-[10px] tracking-widest uppercase transition-colors border ${type === t ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-[#2a2a2a] text-gray-600 hover:text-white'}`}>
                {t === 'gallery' ? 'გალერეა' : t === 'before-after' ? 'Before/After' : 'Featured'}
              </button>
            ))}
          </div>
        </div>
        {/* Barber */}
        <div>
          <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">ბარბერი (სურვილისამებრ)</p>
          <select value={barberId} onChange={e => setBarberId(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]">
            <option value="">ყველა</option>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        {/* Caption */}
        <div className="sm:col-span-2">
          <p className="text-[10px] tracking-widest uppercase text-gray-600 mb-2">წარწერა (სურვილისამებრ)</p>
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="სტილის აღწერა..."
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]" />
        </div>
      </div>

      {/* File upload */}
      <div
        className="border-2 border-dashed border-[#2a2a2a] hover:border-[#C9A84C]/50 transition-colors p-8 text-center cursor-pointer relative mb-4"
        onClick={() => document.getElementById('photo-upload')?.click()}
      >
        {preview ? (
          <img src={preview} alt="" className="max-h-48 mx-auto object-contain" />
        ) : (
          <div>
            <p className="text-gray-500 text-sm mb-1">დააჭირე ფოტოს ასატვირთად</p>
            <p className="text-gray-700 text-xs">{type === 'before-after' ? 'After ფოტო' : 'JPG, PNG, WEBP'}</p>
          </div>
        )}
        <input id="photo-upload" type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {type === 'before-after' && (
        <div
          className="border-2 border-dashed border-[#2a2a2a] hover:border-[#C9A84C]/50 transition-colors p-6 text-center cursor-pointer mb-4"
          onClick={() => document.getElementById('before-upload')?.click()}
        >
          <p className="text-gray-500 text-sm">{beforeFile ? `✓ ${beforeFile.name}` : 'Before ფოტო (სურვილისამებრ)'}</p>
          <input id="before-upload" type="file" accept="image/*" className="hidden"
            onChange={e => setBeforeFile(e.target.files?.[0] ?? null)} />
        </div>
      )}

      <button onClick={handleSubmit} disabled={!file || uploading}
        className="w-full py-3 bg-[#C9A84C] text-[#0a0a0a] text-xs font-bold tracking-widest uppercase hover:bg-[#b8953d] transition-colors disabled:opacity-40">
        {uploading ? 'იტვირთება...' : 'ატვირთვა'}
      </button>
    </div>
  )
}
