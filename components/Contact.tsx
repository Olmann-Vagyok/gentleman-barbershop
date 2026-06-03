import { SHOP_INFO } from '@/lib/data'

const contactItems = [
  {
    label: 'მისამართი',
    value: `${SHOP_INFO.address}, ${SHOP_INFO.city}`,
    sub: `${SHOP_INFO.metro}-ის მახლობლად`,
    href: SHOP_INFO.mapUrl,
    icon: '🗺️',
  },
  {
    label: 'ტელეფონი',
    value: SHOP_INFO.phone,
    sub: 'დარეკე ან WhatsApp',
    href: `tel:${SHOP_INFO.phone.replace(/\s/g, '')}`,
    icon: '☎️',
  },
  {
    label: 'ელ-ფოსტა',
    value: SHOP_INFO.email,
    sub: null,
    href: `mailto:${SHOP_INFO.email}`,
    icon: '📧',
  },
  {
    label: 'სამუშაო საათები',
    value: SHOP_INFO.hours,
    sub: 'ჩანაწერის გარეშე მოსვლა შესაძლებელია',
    href: null,
    icon: '🕐',
  },
]

export default function Contact() {
  return (
    <section id="contact" className="section-padding bg-ink">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="divider-gold" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold">მოგვინახულე</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">
            მოდი
            <br />
            <span className="text-gold-gradient">სალონში</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactItems.map(item => (
              <div key={item.label} className="border border-ink-300 bg-ink-100 p-6">
                <span className="text-gold text-lg opacity-60 block mb-3">{item.icon}</span>
                <p className="text-xs tracking-widest uppercase text-gray-600 mb-1">{item.label}</p>
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-white hover:text-gold transition-colors text-sm font-medium block"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-white text-sm font-medium">{item.value}</p>
                )}
                {item.sub && <p className="text-gray-600 text-xs mt-1">{item.sub}</p>}
              </div>
            ))}

            {/* Social links */}
            <div className="border border-ink-300 bg-ink-100 p-6 sm:col-span-2">
              <p className="text-xs tracking-widest uppercase text-gray-600 mb-4">გამოგვყევი</p>
              <div className="flex gap-4">
                <a
                  href={SHOP_INFO.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm group"
                >
                  <div className="w-8 h-8 border border-ink-400 group-hover:border-gold flex items-center justify-center transition-colors text-xs">
                    IG
                  </div>
                  @gentlemanibilisi
                </a>
                <a
                  href={SHOP_INFO.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm group"
                >
                  <div className="w-8 h-8 border border-ink-400 group-hover:border-gold flex items-center justify-center transition-colors text-xs">
                    FB
                  </div>
                  Gentleman Tbilisi
                </a>
              </div>
            </div>
          </div>

          {/* Map embed */}
          <div className="relative border border-ink-300 overflow-hidden min-h-[320px]">
            <iframe
              title="Gentleman Barbershop-ის მდებარეობა"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2977.4!2d44.780689!3d41.71896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!zNDHCsRDQzJzA4LjIiTiA0NMKw4N7JzA4LjIiRTiTiA0N!5e0!3m2!1sen!2sge!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)', minHeight: '320px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Overlay label */}
            <div className="absolute top-4 left-4 bg-ink/90 border border-ink-300 px-3 py-2">
              <p className="text-xs text-gold tracking-widest uppercase">Gentleman</p>
              <p className="text-xs text-gray-400">{SHOP_INFO.address}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
