import { unstable_noStore as noStore } from 'next/cache'
import { getShopInfo } from '@/lib/store'

export default async function Hero() {
  noStore()
  const info = await getShopInfo()

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-ink z-0" />
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px',
          }}
        />
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
        />
      </div>

      {/* Decorative vertical lines */}
      <div className="absolute left-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-ink-300 to-transparent opacity-40 hidden lg:block" />
      <div className="absolute right-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-ink-300 to-transparent opacity-40 hidden lg:block" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16">
        {/* Top eyebrow */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-px bg-gold opacity-60" />
          <span className="text-xs tracking-[0.3em] uppercase text-gold opacity-80">
            {(info as any).heroEyebrow ?? 'დაარსდა თბილისში, საქართველო'}
          </span>
        </div>

        {/* Main heading */}
        <h1 className="font-serif text-white leading-none mb-6">
          <span className="block text-[clamp(4rem,12vw,10rem)] font-bold tracking-tight">
            GENTLE
          </span>
          <span className="block text-[clamp(4rem,12vw,10rem)] font-bold tracking-tight text-gold-gradient">
            MAN
          </span>
        </h1>

        {/* Tagline row */}
        <div className="flex items-center gap-6 mb-12">
          <div className="h-px flex-1 max-w-[80px] bg-ink-400" />
          <p className="text-sm md:text-base tracking-[0.25em] uppercase text-gray-400">
            {info.tagline}
          </p>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-base md:text-lg max-w-md leading-relaxed mb-14">
          {(info as any).heroDescription ?? 'პრემიუმ სალონი თბილისში. პროფესიული სტრიჟკები, წვერის მოვლა და სტაილინგი გამოცდილ ოსტატთა გუნდისგან. ყოველ დღე ღიაა.'}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#booking" className="btn-gold inline-block text-center">
            {(info as any).heroCtaPrimary ?? 'დაჯავშნე ვიზიტი'}
          </a>
          <a href="#services" className="btn-outline inline-block text-center">
            {(info as any).heroCtaSecondary ?? 'სერვისები'}
          </a>
        </div>

        {/* Stats bar */}
        <div className="mt-20 pt-8 border-t border-ink-300 grid grid-cols-3 gap-8 max-w-md">
          {[
            { value: '5', label: 'გამოცდილი ბარბერი' },
            { value: info.rating, label: 'საშ. შეფასება' },
            { value: '7', label: 'დღე კვირაში' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="font-serif text-3xl text-white font-bold">{stat.value}</div>
              <div className="text-xs text-gray-500 tracking-wide mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
        <span className="text-[10px] tracking-[0.3em] uppercase text-gray-400">გადაახვიე</span>
        <div className="w-px h-8 bg-gray-500" />
      </div>
    </section>
  )
}
