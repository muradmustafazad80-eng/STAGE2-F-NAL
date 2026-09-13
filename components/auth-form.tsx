'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlowButton } from '@/components/glow-button'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Giriş mümkün olmadı.'); return }
      if (data.user.role === 'admin') router.push('/admin')
      else if (data.user.role === 'barber') router.push('/barber')
      else router.push('/account')
      router.refresh()
    } catch { setError('Serverlə əlaqə qurmaq mümkün olmadı.') } finally { setBusy(false) }
  }

  return <form onSubmit={submit} className="space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm text-muted-foreground">E-poçt</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></div><div><label htmlFor="password" className="mb-2 block text-sm text-muted-foreground">Şifrə</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></div>{error && <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<GlowButton full disabled={busy} type="submit" className="bg-primary px-6 py-3.5 text-sm tracking-widest text-primary-foreground">{busy ? 'GİRİLİR...' : 'DAXİL OL'}</GlowButton><p className="text-center text-sm text-muted-foreground">Hesabınız yoxdur? <a href="/register" className="text-primary hover:underline">Qeydiyyatdan keçin</a></p></form>
}

export function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Hesab yaratmaq mümkün olmadı.'); return }
      router.push('/account'); router.refresh()
    } catch { setError('Serverlə əlaqə qurmaq mümkün olmadı.') } finally { setBusy(false) }
  }

  return <form onSubmit={submit} className="space-y-5"><div><label htmlFor="name" className="mb-2 block text-sm text-muted-foreground">Ad, Soyad</label><input id="name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></div><div><label htmlFor="email" className="mb-2 block text-sm text-muted-foreground">E-poçt</label><input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></div><div><label htmlFor="phone" className="mb-2 block text-sm text-muted-foreground">Telefon</label><input id="phone" type="tel" required autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></div><div><label htmlFor="password" className="mb-2 block text-sm text-muted-foreground">Şifrə</label><input id="password" type="password" minLength={8} required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" /></div>{error && <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}<GlowButton full disabled={busy} type="submit" className="bg-primary px-6 py-3.5 text-sm tracking-widest text-primary-foreground">{busy ? 'YARADILIR...' : 'HESAB YARAT'}</GlowButton><p className="text-center text-sm text-muted-foreground">Artıq hesabınız var? <a href="/login" className="text-primary hover:underline">Daxil olun</a></p></form>
}
