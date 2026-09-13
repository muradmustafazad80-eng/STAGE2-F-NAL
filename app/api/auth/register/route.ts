import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { customers, users } from '@/lib/schema'
import { createSession, getBusinessBySlug, hashPassword, normalizeEmail, normalizePhone } from '@/lib/auth'
import { consumeRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/),
  password: z.string().min(8).max(128),
  businessSlug: z.string().trim().min(2).max(80).optional(),
})

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Daxil etdiyiniz məlumatlar düzgün deyil.', code: 'VALIDATION_ERROR' }, { status: 400 })
    const email = normalizeEmail(parsed.data.email)
    const phone = normalizePhone(parsed.data.phone)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!(await consumeRateLimit(`register:${ip}`, 5)) || !(await consumeRateLimit(`register:${email}`, 5))) {
      return NextResponse.json({ success: false, error: 'Çox sayda cəhd edildi. Bir az sonra yenidən yoxlayın.', code: 'RATE_LIMITED' }, { status: 429 })
    }

    const [business] = await getBusinessBySlug(parsed.data.businessSlug || 'kral-barber')
    if (!business) return NextResponse.json({ success: false, error: 'Biznes tapılmadı.', code: 'NOT_FOUND' }, { status: 404 })
    const existingUser = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), eq(users.businessId, business.id))).limit(1)
    if (existingUser[0]) return NextResponse.json({ success: false, error: 'Bu e-poçt ilə hesab artıq mövcuddur.', code: 'CONFLICT' }, { status: 409 })

    const existingCustomer = await db.select({ id: customers.id, userId: customers.userId }).from(customers).where(and(eq(customers.businessId, business.id), eq(customers.phone, phone))).limit(1)
    if (existingCustomer[0]?.userId) return NextResponse.json({ success: false, error: 'Bu telefon nömrəsi artıq başqa hesabla bağlıdır.', code: 'CONFLICT' }, { status: 409 })

    const passwordHash = await hashPassword(parsed.data.password)
    const createdId = await db.transaction(async (tx) => {
      const created = await tx.insert(users).values({ businessId: business.id, email, passwordHash, role: 'customer' }).returning({ id: users.id })
      if (!created[0]) throw new Error('USER_CREATE_FAILED')
      if (existingCustomer[0]) {
        await tx.update(customers).set({ userId: created[0].id, name: parsed.data.name }).where(and(eq(customers.id, existingCustomer[0].id), eq(customers.businessId, business.id)))
      } else {
        await tx.insert(customers).values({ businessId: business.id, userId: created[0].id, name: parsed.data.name, phone })
      }
      return created[0].id
    })
    await createSession(createdId, business.id)

    return NextResponse.json({ success: true, user: { email, role: 'customer' } }, { status: 201 })
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : ''
    if (code === '23505') return NextResponse.json({ success: false, error: 'Bu hesab artıq mövcuddur.', code: 'CONFLICT' }, { status: 409 })
    console.error('POST /api/auth/register', error)
    return NextResponse.json({ success: false, error: 'Hesab yaradılarkən xəta baş verdi.', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
