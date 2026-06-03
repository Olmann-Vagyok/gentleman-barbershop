import { SHOP_INFO, SERVICES } from '@/lib/data'

export default function Footer() {
  return (
    <footer className="bg-ink-100 border-t border-ink-300">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 border border-gold flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#C9A84C" strokeWidth="1.2" />
                </svg>
              </span>
              <span className="font-serif text-white text-lg tracking-widest uppercase">
                Gentleman
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Premium barbershop in Tbilisi. Expert cuts, grooming, and styling — every day of the
              week.
            </p>
            <p className="text-gold text-xs tracking-widest">{SHOP_INFO.tagline}</p>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs tracking-widest uppercase text-gray-600 mb-5">Services</p>
            <ul className="flex flex-col gap-2">
              {SERVICES.map(s => (
                <li key={s.id}>
                  <a
                    href="#booking"
                    className="text-gray-400 hover:text-white text-sm transition-colors flex justify-between max-w-[200px]"
                  >
                    <span>{s.name}</span>
                    <span className="text-gray-600">{s.price} GEL</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs tracking-widest uppercase text-gray-600 mb-5">Contact</p>
            <div className="flex flex-col gap-3">
              <a href={`tel:${SHOP_INFO.phone}`} className="text-gray-400 hover:text-white text-sm transition-colors">
                {SHOP_INFO.phone}
              </a>
              <a href={`mailto:${SHOP_INFO.email}`} className="text-gray-400 hover:text-white text-sm transition-colors">
                {SHOP_INFO.email}
              </a>
              <p className="text-gray-500 text-sm">{SHOP_INFO.address}</p>
              <p className="text-gray-500 text-sm">{SHOP_INFO.city}</p>
              <p className="text-gray-400 text-sm mt-2">{SHOP_INFO.hours}</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-ink-300 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-700 text-xs">
            © {new Date().getFullYear()} Gentleman Barbershop Tbilisi. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href={SHOP_INFO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gold text-xs tracking-widest uppercase transition-colors"
            >
              Instagram
            </a>
            <a
              href={SHOP_INFO.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gold text-xs tracking-widest uppercase transition-colors"
            >
              Facebook
            </a>
            <a href="#booking" className="text-gray-600 hover:text-gold text-xs tracking-widest uppercase transition-colors">
              Book Now
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
