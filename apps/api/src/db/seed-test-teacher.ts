/**
 * Idempotent demo teacher seed — creates a real Supabase Auth account
 * (email/password, role: teacher) plus matching users/teachers rows and a
 * little sample data, so someone can log into the admin app's teacher
 * portal (`/my/*`) end-to-end. Safe to run multiple times.
 *
 * Writes through Supabase's HTTPS API (service-role key) rather than a direct
 * Postgres connection, because the direct DB host is IPv6-only on projects
 * without the IPv4 add-on and fails to resolve on many networks.
 *
 * Run with:
 *   pnpm --filter=api db:seed-teacher
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const TEACHER_EMAIL = 'teacher.demo@beam.in'
const TEACHER_PASSWORD = 'Beam@2024!'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (see apps/api/.env)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString() }
function daysFromNow(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString() }

function must<T>(result: { data: T; error: { message: string } | null }, label: string): T {
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  return result.data
}

function mustList<T>(result: { data: T[] | null; error: { message: string } | null }, label: string): T[] {
  return must(result, label) ?? []
}

async function findAuthUserByEmail(email: string) {
  let page = 1
  const perPage = 200
  // supabase-js admin API has no getUserByEmail — page through listUsers
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) return match
    if (data.users.length < perPage) return null
    page += 1
  }
}

async function ensureAuthUser(): Promise<string> {
  const existing = await findAuthUserByEmail(TEACHER_EMAIL)
  if (existing) {
    console.log('  → Supabase auth user already exists:', existing.id)
    await supabase.auth.admin.updateUserById(existing.id, {
      password: TEACHER_PASSWORD,
      app_metadata: { ...existing.app_metadata, role: 'teacher' },
    })
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: TEACHER_EMAIL,
    password: TEACHER_PASSWORD,
    email_confirm: true,
    app_metadata: { role: 'teacher' },
    user_metadata: { full_name: 'Demo Teacher' },
  })
  if (error || !data.user) throw error ?? new Error('createUser returned no user')
  console.log('  → Supabase auth user created:', data.user.id)
  return data.user.id
}

async function seedTestTeacher() {
  console.log('🧪 Seeding demo teacher account…')

  const teacherId = await ensureAuthUser()

  must(
    await supabase.from('users').upsert(
      {
        id: teacherId,
        email: TEACHER_EMAIL,
        role: 'teacher',
        first_name: 'Demo',
        last_name: 'Teacher',
        phone: '+919888800000',
        city: 'Bengaluru',
      },
      { onConflict: 'id' }
    ),
    'upsert users'
  )
  console.log('  → users row upserted')

  const existingTeacher = must(
    await supabase.from('teachers').select('id').eq('user_id', teacherId).maybeSingle(),
    'select teachers'
  )
  if (!existingTeacher) {
    must(
      await supabase.from('teachers').insert({
        user_id: teacherId,
        bio: 'Demo teacher account for testing the admin teacher portal.',
        specializations: ['Art & Craft', 'Storytelling'],
        languages: ['English', 'Hindi'],
        verification_status: 'verified',
        rating: '4.8',
        review_count: 12,
        availability_json: {
          Mon: ['10:00-12:00', '15:00-18:00'],
          Wed: ['10:00-12:00', '15:00-18:00'],
          Fri: ['10:00-12:00'],
        },
      }),
      'insert teachers'
    )
    console.log('  → teacher profile row created')
  } else {
    console.log('  → teacher profile row already exists, skipping')
  }

  // ── Sample sessions + a payout, so My Schedule / My Earnings aren't empty ──
  const existingBookings = mustList(
    await supabase.from('bookings').select('id').eq('teacher_id', teacherId),
    'select bookings'
  )

  if (existingBookings.length > 0) {
    console.log(`  → ${existingBookings.length} bookings already exist for this teacher, skipping sample data`)
  } else {
    const activities = mustList(
      await supabase
        .from('activities')
        .select('id, price_per_session, session_type')
        .eq('status', 'published')
        .limit(3),
      'select activities'
    )
    const parent = must(
      await supabase.from('users').select('id').eq('role', 'parent').limit(1).maybeSingle(),
      'select parent'
    )
    const child = parent
      ? must(
          await supabase.from('children').select('id').eq('parent_id', parent.id).limit(1).maybeSingle(),
          'select child'
        )
      : null

    if (activities.length > 0 && parent && child) {
      const specs = [
        { status: 'confirmed', scheduledAt: daysFromNow(2) },
        { status: 'completed', scheduledAt: daysAgo(5) },
        { status: 'completed', scheduledAt: daysAgo(10) },
      ]
      const bookingRows = mustList(
        await supabase
          .from('bookings')
          .insert(
            specs.map((s, i) => {
              const activity = activities[i % activities.length]
              return {
                parent_id: parent.id,
                child_id: child.id,
                teacher_id: teacherId,
                activity_id: activity.id,
                status: s.status,
                session_type: activity.session_type,
                total_amount: activity.price_per_session,
                scheduled_at: s.scheduledAt,
                completed_at: s.status === 'completed' ? s.scheduledAt : null,
                created_at: daysAgo(i + 15),
              }
            })
          )
          .select('id'),
        'insert bookings'
      )
      console.log(`  → ${bookingRows.length} sample bookings created`)

      must(
        await supabase.from('payouts').insert({
          teacher_id: teacherId,
          amount: '1200',
          session_count: 2,
          status: 'settled',
          bank_account: '····4821',
          scheduled_at: daysAgo(3),
          settled_at: daysAgo(1),
        }),
        'insert payouts'
      )
      console.log('  → sample payout created')
    } else {
      console.log('  → skipped sample bookings (no published activities/parent found — run `pnpm --filter=api db:seed` first for richer demo data)')
    }
  }

  console.log('✅ Demo teacher seed complete')
  console.log('   Admin app login:', TEACHER_EMAIL, '/', TEACHER_PASSWORD)
  console.log('   User ID:', teacherId)
}

seedTestTeacher().catch((err) => {
  console.error('❌ Demo teacher seed failed:', err)
  process.exit(1)
})
