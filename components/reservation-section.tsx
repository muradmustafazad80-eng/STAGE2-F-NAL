'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Check, Crown, RefreshCw } from 'lucide-react'
import { GlowButton } from '@/components/glow-button'

type Service = { id: string; name: string; price: string | number; duration: number }
type Barber = { id: string; name: string; specialty: string }
type Result = { done: boolean; name: string; bookingId: string }

type AvailabilityResponse = { success: boolean; slots?: string[]; error?: string }

function todayString() { return new Date().toISOString().slice(0, 10) }

export function ReservationSection() {
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [serviceId, setServiceId] = useState('')
  const [barberId, setBarberId] = useState('')
  const [date, setDate] = useState(todayString())
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result>({ done: false, name: '', bookingId: '' })

  useEffect(() => {
    Promise.all([fetch('/api/services'), fetch('/api/barbers')])
      .then(async ([servicesRes, barbersRes]) => {
        const [servicesData, barbersData] = await Promise.all([servicesRes.json(), barbersRes.json()])
        setServices(Array.isArray(servicesData) ? servicesData : [])
        setBarbers(Array.isArray(barbersData) ? barbersData : [])
      })
      .catch(() => { setServices([]); setBarbers([]); setError('Xidmət və ustalar yüklənmədi.') })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!serviceId || !barberId || !date) { setSlots([]); setTime(''); return }
    setSlotsLoading(true); setError(''); setTime('')
    fetch(`/api/availability?serviceId=${encodeURIComponent(serviceId)}&barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(date)}`)
      .then(async (res) => {
        const data: AvailabilityResponse = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || 'Boş vaxtlar tapılmadı.')
        setSlots(data.slots || [])
      })
      .catch((e) => { setSlots([]); setError(e instanceof Error ? e.message : 'Boş vaxtlar yüklənmədi.') })
      .finally(() => setSlotsLoading(false))
  }, [serviceId, barberId, date])

  const selectedService = useMemo(() => services.find((item) => item.id === serviceId), [services, serviceId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting || !serviceId || !barberId || !date || !time) return
    const formData = new FormData(e.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const phone = String(formData.get('phone') || '').trim()
    if (!name || !phone) { setError('Ad və telefon nömrəsi mütləqdir.'); return }

    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name, customerPhone: phone, barberId, serviceId, dateTime: `${date}T${time}:00` }),
      })
      const bookingRes = await res.json()
      if (!res.ok || !bookingRes.success) { if (res.status === 401) { setError('Rezervasiya üçün əvvəlcə hesabınıza daxil olun.'); return } setError(bookingRes.error || 'Rezervasiya yaradıla bilmədi.'); return }
      setResult({ done: true, name, bookingId: bookingRes.bookingId })
    } catch { setError('Serverlə əlaqə qurmaq mümkün olmadı.') } finally { setSubmitting(false) }
  }

  function reset() { setResult({ done: false, name: '', bookingId: '' }); setTime(''); setError('') }

  return (
    <section id="rezervasiya" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
          <div className="grid md:grid-cols-2">
            <div className="flex flex-col justify-center p-8 md:p-12">
              <span className="inline-flex w-fit items-center gap-2 text-xs font-medium tracking-[0.3em] text-primary"><CalendarCheck className="size-4" aria-hidden="true" />REZERVASİYA</span>
              <h2 className="mt-4 text-balance font-serif text-3xl font-semibold tracking-tight md:text-4xl">Yerinizi indi ayırın</h2>
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">Xidmət və ustanı seçin, sonra yalnız həqiqətən boş olan vaxtlardan birini götürün.</p>
              <ul className="mt-8 space-y-3">
                {['Həqiqi boş vaxt seçimi', 'Ustanın iş saatlarının yoxlanması', 'Server tərəfindən təsdiq'].map((t) => <li key={t} className="flex items-center gap-3 text-sm text-muted-foreground"><Check className="size-4 text-primary" aria-hidden="true" />{t}</li>)}
                <li className="flex items-center gap-3 text-sm text-primary"><Crown className="size-4" aria-hidden="true" />Premium xidmət təcrübəsi</li>
              </ul>
            </div>
            <div className="border-t border-border/60 bg-card/60 p-8 md:border-l md:border-t-0 md:p-12">
              {result.done ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary"><Check className="size-7" aria-hidden="true" /></span>
                  <h3 className="mt-6 font-serif text-2xl font-semibold">Təşəkkür edirik, {result.name}!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Rezervasiyanız qeydə alındı. Sifariş nömrəniz: <span className="text-foreground">{result.bookingId.slice(0, 8)}</span></p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3"><a href="/account" className="rounded-sm bg-primary px-5 py-3 text-sm font-medium tracking-widest text-primary-foreground">HESABIMA KEÇ</a><GlowButton onClick={reset} className="border border-primary/50 bg-background/40 px-6 py-3 text-sm font-medium tracking-widest text-foreground hover:border-primary hover:text-primary">YENİ REZERVASİYA</GlowButton></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div><label htmlFor="name" className="mb-2 block text-sm text-muted-foreground">Ad, Soyad</label><input id="name" name="name" required placeholder="Adınızı daxil edin" className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary" /></div>
                  <div><label htmlFor="phone" className="mb-2 block text-sm text-muted-foreground">Telefon</label><input id="phone" name="phone" type="tel" required placeholder="+994 __ ___ __ __" className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary" /></div>
                  <div><label htmlFor="serviceId" className="mb-2 block text-sm text-muted-foreground">1. Xidmət</label><select id="serviceId" name="serviceId" required disabled={loading || services.length === 0} value={serviceId} onChange={(e) => { setServiceId(e.target.value); setTime('') }} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"><option value="">Xidmət seçin</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.price} AZN · {s.duration} dəq.</option>)}</select></div>
                  <div><label htmlFor="barberId" className="mb-2 block text-sm text-muted-foreground">2. Usta</label><select id="barberId" name="barberId" required disabled={!serviceId || loading || barbers.length === 0} value={barberId} onChange={(e) => { setBarberId(e.target.value); setTime('') }} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"><option value="">Usta seçin</option>{barbers.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.specialty}</option>)}</select></div>
                  <div><label htmlFor="date" className="mb-2 block text-sm text-muted-foreground">3. Tarix</label><input id="date" name="date" type="date" min={todayString()} required disabled={!barberId} value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></div>
                  <div><label className="mb-2 block text-sm text-muted-foreground">4. Boş vaxt {selectedService ? `(${selectedService.duration} dəqiqə)` : ''}</label>{slotsLoading ? <div className="flex items-center gap-2 rounded-sm border border-border px-4 py-3 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin" />Yoxlanılır...</div> : slots.length ? <div className="grid grid-cols-3 gap-2">{slots.map((slot) => <button key={slot} type="button" onClick={() => setTime(slot)} aria-pressed={time === slot} className={`rounded-sm border px-3 py-2 text-sm transition-colors ${time === slot ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>{slot}</button>)}</div> : <div className="rounded-sm border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">Bu tarix üçün uyğun boş vaxt yoxdur.</div>}</div>
                  {error && <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
                  <GlowButton type="submit" full disabled={submitting || loading || !serviceId || !barberId || !time} className="bg-primary px-6 py-3.5 text-sm font-medium tracking-widest text-primary-foreground transition-opacity hover:opacity-90">{submitting ? 'YARADILIR...' : 'REZERVASİYANI TƏSDİQLƏ'}</GlowButton>
                  <p className="text-center text-xs text-muted-foreground">Mövcud hesabınız varsa, <a href="/login" className="text-primary hover:underline">daxil olun</a>. Rezervasiya üçün əvvəlcə hesabınıza daxil olun.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
