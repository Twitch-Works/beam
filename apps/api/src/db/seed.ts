import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import * as schema from './schema.js'

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

function dateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding Beam database…')

  // ── Categories ──────────────────────────────────────────────────────────────
  console.log('  → categories')

  const categoryRows = await db.insert(schema.categories).values([
    { name: 'Dance', color: '#A7BBFA', icon: '💃' },
    { name: 'Art & Craft', color: '#FCB857', icon: '🎨' },
    { name: 'Music', color: '#FF7A59', icon: '🎵' },
    { name: 'STEM', color: '#1787A6', icon: '🔬' },
    { name: 'Storytelling', color: '#A7BBFA', icon: '📖' },
    { name: 'Yoga & Wellness', color: '#22C55E', icon: '🧘' },
    { name: 'Cooking', color: '#FCB857', icon: '🍳' },
    { name: 'Math & Logic', color: '#1787A6', icon: '🧩' },
  ]).returning()

  const catMap = Object.fromEntries(categoryRows.map(c => [c.name, c.id]))

  // ── Admin Users ─────────────────────────────────────────────────────────────
  console.log('  → admin users')

  await db.insert(schema.users).values([
    {
      email: 'admin@beam.co',
      role: 'admin',
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+919876543210',
      city: 'Mumbai',
    },
    {
      email: 'ops@beam.co',
      role: 'admin',
      firstName: 'Rohan',
      lastName: 'Mehta',
      phone: '+919876543211',
      city: 'Bengaluru',
    },
    {
      email: 'super@beam.co',
      role: 'super_admin',
      firstName: 'Ananya',
      lastName: 'Kapoor',
      phone: '+919876543212',
      city: 'Delhi',
    },
  ])

  // ── Parents ─────────────────────────────────────────────────────────────────
  console.log('  → parents')

  const parentData = [
    { firstName: 'Deepika', lastName: 'Patel', city: 'Mumbai' },
    { firstName: 'Arjun', lastName: 'Singh', city: 'Delhi' },
    { firstName: 'Sunita', lastName: 'Rao', city: 'Bengaluru' },
    { firstName: 'Vikram', lastName: 'Nair', city: 'Chennai' },
    { firstName: 'Meera', lastName: 'Joshi', city: 'Pune' },
    { firstName: 'Rajesh', lastName: 'Agarwal', city: 'Mumbai' },
    { firstName: 'Kavitha', lastName: 'Reddy', city: 'Hyderabad' },
    { firstName: 'Amit', lastName: 'Gupta', city: 'Delhi' },
    { firstName: 'Pooja', lastName: 'Iyer', city: 'Bengaluru' },
    { firstName: 'Sanjay', lastName: 'Kumar', city: 'Kolkata' },
    { firstName: 'Nisha', lastName: 'Malhotra', city: 'Mumbai' },
    { firstName: 'Ravi', lastName: 'Krishnan', city: 'Chennai' },
    { firstName: 'Anjali', lastName: 'Verma', city: 'Pune' },
    { firstName: 'Suresh', lastName: 'Pillai', city: 'Kochi' },
    { firstName: 'Lakshmi', lastName: 'Bhat', city: 'Bengaluru' },
  ]

  const parentUsers = await db.insert(schema.users).values(
    parentData.map((p, i) => ({
      email: `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@example.com`,
      role: 'parent' as const,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: `+9198765432${String(i + 20).padStart(2, '0')}`,
      city: p.city,
      createdAt: daysAgo(Math.floor(Math.random() * 120) + 10),
    }))
  ).returning()

  // ── Children ─────────────────────────────────────────────────────────────────
  console.log('  → children')

  const childrenNames = [
    ['Aarav', 'Patel'], ['Ananya', 'Singh'], ['Kabir', 'Rao'], ['Diya', 'Nair'],
    ['Aryan', 'Joshi'], ['Ishaan', 'Agarwal'], ['Saanvi', 'Reddy'], ['Vivaan', 'Gupta'],
    ['Myra', 'Iyer'], ['Reyansh', 'Kumar'], ['Anika', 'Malhotra'], ['Vihaan', 'Krishnan'],
    ['Pihu', 'Verma'], ['Arnav', 'Pillai'], ['Navya', 'Bhat'], ['Siya', 'Patel'],
    ['Advait', 'Singh'], ['Kiara', 'Rao'], ['Krish', 'Nair'], ['Riya', 'Joshi'],
  ]

  const dobs = [
    '2018-03-15', '2019-07-22', '2017-11-08', '2020-01-30', '2018-09-14',
    '2016-05-25', '2019-12-03', '2017-08-19', '2021-02-11', '2018-06-27',
    '2019-04-08', '2016-10-14', '2020-08-22', '2017-03-17', '2018-11-09',
    '2021-05-30', '2019-01-15', '2016-07-04', '2020-10-19', '2018-02-28',
  ]

  const childRows = await db.insert(schema.children).values(
    childrenNames.map(([firstName, lastName], i) => ({
      parentId: parentUsers[Math.floor(i / 1.4) % parentUsers.length].id,
      firstName,
      lastName,
      dateOfBirth: dobs[i],
      createdAt: daysAgo(Math.floor(Math.random() * 90) + 5),
    }))
  ).returning()

  // ── Teachers ─────────────────────────────────────────────────────────────────
  console.log('  → teachers')

  const teacherData = [
    { firstName: 'Neha', lastName: 'Sharma', city: 'Mumbai', specs: ['Dance', 'Yoga & Wellness'], rating: '4.9', reviews: 87, verified: true },
    { firstName: 'Kiran', lastName: 'Desai', city: 'Bengaluru', specs: ['Art & Craft', 'Storytelling'], rating: '4.7', reviews: 62, verified: true },
    { firstName: 'Preethi', lastName: 'Nair', city: 'Chennai', specs: ['Music', 'Dance'], rating: '4.8', reviews: 104, verified: true },
    { firstName: 'Aditya', lastName: 'Bose', city: 'Kolkata', specs: ['STEM', 'Math & Logic'], rating: '4.6', reviews: 45, verified: true },
    { firstName: 'Swathi', lastName: 'Rao', city: 'Hyderabad', specs: ['Cooking', 'Art & Craft'], rating: '4.5', reviews: 38, verified: true },
    { firstName: 'Manish', lastName: 'Tiwari', city: 'Delhi', specs: ['Math & Logic', 'STEM'], rating: '4.3', reviews: 29, verified: true },
    { firstName: 'Divya', lastName: 'Menon', city: 'Kochi', specs: ['Yoga & Wellness', 'Dance'], rating: '0', reviews: 0, verified: false },
    { firstName: 'Siddharth', lastName: 'Pillai', city: 'Pune', specs: ['Storytelling', 'Music'], rating: '0', reviews: 0, verified: false },
    { firstName: 'Pooja', lastName: 'Chandra', city: 'Mumbai', specs: ['Art & Craft'], rating: '4.1', reviews: 12, verified: true },
    { firstName: 'Rahul', lastName: 'Saxena', city: 'Delhi', specs: ['STEM'], rating: '0', reviews: 0, verified: false },
  ]

  const teacherUserRows = await db.insert(schema.users).values(
    teacherData.map((t, i) => ({
      email: `teacher.${t.firstName.toLowerCase()}.${t.lastName.toLowerCase()}@beam.co`,
      role: 'teacher' as const,
      firstName: t.firstName,
      lastName: t.lastName,
      phone: `+9197654321${String(i + 10).padStart(2, '0')}`,
      city: t.city,
      createdAt: daysAgo(Math.floor(Math.random() * 200) + 30),
    }))
  ).returning()

  const teacherRows = await db.insert(schema.teachers).values(
    teacherData.map((t, i) => ({
      userId: teacherUserRows[i].id,
      bio: `Experienced ${t.specs[0]} educator with a passion for child development.`,
      specializations: t.specs,
      verificationStatus: t.verified ? 'verified' as const : 'pending' as const,
      rating: t.rating,
      reviewCount: t.reviews,
      bankAccountJson: t.verified ? { bank: 'HDFC', account: `***${1000 + i}`, ifsc: 'HDFC0001234' } : null,
      documents: t.verified ? [
        { type: 'aadhaar', url: 'https://example.com/doc1.pdf', verified: true },
        { type: 'police_clearance', url: 'https://example.com/doc2.pdf', verified: true },
      ] : [],
    }))
  ).returning()

  // ── Activities ───────────────────────────────────────────────────────────────
  console.log('  → activities')

  // Bangalore-area coordinates (city center: 12.9716, 77.5946)
  // Each activity gets a unique location within ~8km of Koramangala/Indiranagar/HSR
  const activityData = [
    {
      title: 'Messy Play Adventure',
      description: 'A sensory-rich experience where children explore textures, colours, and creativity through guided messy play. Develops fine motor skills and sensory processing.',
      categoryId: catMap['Art & Craft'],
      ageGroup: '2-4 years',
      sessionType: '1:1' as const,
      sessionDurationMins: 45,
      pricePerSession: '649',
      imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400',
      tags: ['sensory', 'creative', 'motor skills'],
      status: 'published' as const,
      latitude: 12.9352, longitude: 77.6245, // Koramangala
    },
    {
      title: 'Classical Dance Foundations',
      description: 'Introduction to Bharatanatyam for young learners. Children learn basic mudras, footwork, and storytelling through dance in a joyful, structured environment.',
      categoryId: catMap['Dance'],
      ageGroup: '5-8 years',
      sessionType: '1:1' as const,
      sessionDurationMins: 60,
      pricePerSession: '799',
      imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
      tags: ['bharatanatyam', 'classical', 'rhythm'],
      status: 'published' as const,
      latitude: 12.9784, longitude: 77.6408, // Indiranagar
    },
    {
      title: 'Little Scientists Club',
      description: 'Hands-on STEM experiments designed for curious young minds. Each session explores a new science concept through safe, exciting experiments they can share with family.',
      categoryId: catMap['STEM'],
      ageGroup: '6-10 years',
      sessionType: 'group' as const,
      minChildren: 2,
      maxChildren: 5,
      sessionDurationMins: 90,
      pricePerSession: '499',
      imageUrl: 'https://images.unsplash.com/photo-1532094349884-543559059938?w=400',
      tags: ['science', 'experiments', 'critical thinking'],
      status: 'published' as const,
      latitude: 12.9116, longitude: 77.6389, // HSR Layout
    },
    {
      title: 'Keyboard & Melody Basics',
      description: 'Learn to play simple melodies on keyboard while understanding musical concepts like notes, rhythm, and timing. Builds auditory skills and discipline.',
      categoryId: catMap['Music'],
      ageGroup: '5-12 years',
      sessionType: '1:1' as const,
      sessionDurationMins: 45,
      pricePerSession: '749',
      imageUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400',
      tags: ['keyboard', 'music theory', 'rhythm'],
      status: 'published' as const,
      latitude: 12.9698, longitude: 77.5986, // MG Road
    },
    {
      title: 'Storytelling & Creative Writing',
      description: 'Children craft and narrate their own stories with the help of puppets, props, and imagination prompts. Develops language, empathy, and self-expression.',
      categoryId: catMap['Storytelling'],
      ageGroup: '6-10 years',
      sessionType: '1:1' as const,
      sessionDurationMins: 60,
      pricePerSession: '599',
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
      tags: ['storytelling', 'language', 'creativity'],
      status: 'published' as const,
      latitude: 13.0067, longitude: 77.5798, // Malleshwaram
    },
    {
      title: 'Kids Yoga & Mindfulness',
      description: 'Gentle yoga flows, breathing techniques, and mindfulness exercises adapted for children. Helps with focus, emotional regulation, and body awareness.',
      categoryId: catMap['Yoga & Wellness'],
      ageGroup: '4-10 years',
      sessionType: '1:1' as const,
      sessionDurationMins: 45,
      pricePerSession: '649',
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
      tags: ['yoga', 'mindfulness', 'breathing'],
      status: 'published' as const,
      latitude: 12.9255, longitude: 77.5858, // Jayanagar
    },
    {
      title: 'Junior Chef: Baking Basics',
      description: 'Young chefs learn to measure, mix, and bake simple treats under guided supervision. Builds math skills, patience, and kitchen confidence.',
      categoryId: catMap['Cooking'],
      ageGroup: '7-12 years',
      sessionType: '1:1' as const,
      sessionDurationMins: 90,
      pricePerSession: '849',
      imageUrl: 'https://images.unsplash.com/photo-1591019479261-1a103585c559?w=400',
      tags: ['baking', 'cooking', 'measurement'],
      status: 'published' as const,
      latitude: 12.9165, longitude: 77.6101, // BTM Layout
    },
    {
      title: 'Math Puzzles & Number Games',
      description: 'Make maths fun! Interactive puzzles, card games, and manipulatives that build number sense and logical reasoning without worksheets.',
      categoryId: catMap['Math & Logic'],
      ageGroup: '6-10 years',
      sessionType: '1:1' as const,
      sessionDurationMins: 60,
      pricePerSession: '549',
      imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
      tags: ['math', 'puzzles', 'number sense'],
      status: 'published' as const,
      latitude: 12.9830, longitude: 77.5680, // Rajajinagar
    },
    {
      title: 'Watercolour Wonders',
      description: 'An expressive art class introducing watercolour techniques — wet-on-wet, blending, and resist methods — through seasonal themes and storybook inspiration.',
      categoryId: catMap['Art & Craft'],
      ageGroup: '6-12 years',
      sessionType: '1:1' as const,
      sessionDurationMins: 60,
      pricePerSession: '699',
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
      tags: ['watercolour', 'painting', 'art'],
      status: 'published' as const,
      latitude: 12.9602, longitude: 77.6410, // Domlur
    },
    {
      title: 'Hip-Hop Dance Fundamentals',
      description: 'High-energy hip-hop sessions covering popping, locking, and freestyle basics. Builds coordination, confidence, and self-expression through movement.',
      categoryId: catMap['Dance'],
      ageGroup: '8-14 years',
      sessionType: 'group' as const,
      minChildren: 2,
      maxChildren: 6,
      sessionDurationMins: 60,
      pricePerSession: '599',
      imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400',
      tags: ['hip-hop', 'dance', 'freestyle'],
      status: 'published' as const,
      latitude: 12.9279, longitude: 77.6271, // Electronic City fringe
    },
    {
      title: 'Robotics for Kids',
      description: 'Introduction to basic robotics and coding concepts using age-appropriate building kits. Children design, build, and program simple robots.',
      categoryId: catMap['STEM'],
      ageGroup: '8-14 years',
      sessionType: 'group' as const,
      minChildren: 2,
      maxChildren: 4,
      sessionDurationMins: 90,
      pricePerSession: '899',
      imageUrl: 'https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?w=400',
      tags: ['robotics', 'coding', 'engineering'],
      status: 'draft' as const,
      latitude: 12.9941, longitude: 77.6940, // Whitefield
    },
    {
      title: 'Puppet Theatre Workshop',
      description: 'Children design their own puppets and perform short plays, developing storytelling, teamwork, and public speaking in a playful setting.',
      categoryId: catMap['Storytelling'],
      ageGroup: '5-9 years',
      sessionType: '1:1' as const,
      sessionDurationMins: 60,
      pricePerSession: '629',
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      tags: ['puppets', 'theatre', 'performance'],
      status: 'published' as const,
      latitude: 12.9516, longitude: 77.5853, // Basavanagudi
    },
  ]

  const activityRows = await db.insert(schema.activities).values(activityData).returning()

  // ── Slots ────────────────────────────────────────────────────────────────────
  console.log('  → slots')

  const timeSlots = ['09:00', '10:30', '12:00', '14:00', '16:00', '17:30']
  const slotValues: (typeof schema.slots.$inferInsert)[] = []

  for (let d = 0; d < 14; d++) {
    const date = dateStr(daysFromNow(d))
    for (const activity of activityRows.slice(0, 8)) {
      const teacher = teacherUserRows[Math.floor(Math.random() * 6)]
      const time = randomFrom(timeSlots)
      const [h, m] = time.split(':').map(Number)
      const totalMins = h * 60 + m + activity.sessionDurationMins
      const endH = Math.floor(totalMins / 60)
      const endM = totalMins % 60
      slotValues.push({
        teacherId: teacher.id,
        activityId: activity.id,
        date,
        startTime: time,
        endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
        isAvailable: true,
      })
    }
  }

  const slotRows = await db.insert(schema.slots).values(slotValues).returning()

  // ── Bookings ─────────────────────────────────────────────────────────────────
  console.log('  → bookings')

  const statusDistribution: Array<'pending' | 'confirmed' | 'completed' | 'cancelled'> = [
    'completed', 'completed', 'completed', 'completed', 'completed',
    'completed', 'completed', 'completed', 'completed', 'completed',
    'confirmed', 'confirmed', 'confirmed', 'confirmed', 'confirmed',
    'confirmed', 'confirmed', 'confirmed',
    'pending', 'pending', 'pending', 'pending',
    'cancelled', 'cancelled', 'cancelled',
  ]

  const bookingValues = statusDistribution.map((status, i) => {
    const parent = parentUsers[i % parentUsers.length]
    const child = childRows[i % childRows.length]
    const teacher = teacherUserRows[i % 6]
    const activity = activityRows[i % activityRows.length]
    const slot = slotRows[i % slotRows.length]
    const amount = Number(activity.pricePerSession)
    const daysOffset = status === 'completed' ? -(i + 1) : status === 'cancelled' ? -(i + 5) : 0

    return {
      parentId: parent.id,
      childId: child.id,
      teacherId: teacher.id,
      activityId: activity.id,
      slotId: slot.id,
      status,
      sessionType: activity.sessionType,
      totalAmount: String(amount),
      discountAmount: i % 5 === 0 ? '50' : '0',
      discountCode: i % 5 === 0 ? 'BEAM50' : null,
      scheduledAt: daysOffset !== 0 ? daysAgo(-daysOffset) : daysFromNow(i % 7 + 1),
      createdAt: daysAgo(i + 2),
    }
  })

  const bookingRows = await db.insert(schema.bookings).values(bookingValues).returning()

  // ── Payments ─────────────────────────────────────────────────────────────────
  console.log('  → payments')

  const gateways: Array<'razorpay' | 'upi' | 'card'> = ['razorpay', 'upi', 'card']

  await db.insert(schema.payments).values(
    bookingRows.map((b, i) => ({
      bookingId: b.id,
      parentId: b.parentId,
      amount: b.totalAmount,
      gateway: randomFrom(gateways),
      gatewayPaymentId: `pay_${Math.random().toString(36).slice(2, 14)}`,
      status: b.status === 'cancelled' ? 'refunded' as const
        : b.status === 'pending' ? 'pending' as const
        : i % 15 === 0 ? 'failed' as const
        : 'success' as const,
      refundedAt: b.status === 'cancelled' ? daysAgo(1) : null,
      createdAt: b.createdAt,
    }))
  )

  // ── Payouts ──────────────────────────────────────────────────────────────────
  console.log('  → payouts')

  const payoutStatuses: Array<'queued' | 'dispatched' | 'settled'> = ['queued', 'queued', 'dispatched', 'settled', 'settled', 'settled']

  await db.insert(schema.payouts).values(
    teacherUserRows.slice(0, 6).map((t, i) => ({
      teacherId: t.id,
      amount: String(2000 + i * 500 + Math.floor(Math.random() * 1500)),
      sessionCount: 3 + i,
      bookingIds: bookingRows.slice(i * 2, i * 2 + 3).map(b => b.id),
      status: payoutStatuses[i],
      bankAccount: teacherRows[i].bankAccountJson
        ? (teacherRows[i].bankAccountJson as { account: string }).account
        : null,
      scheduledAt: daysFromNow(2),
      settledAt: payoutStatuses[i] === 'settled' ? daysAgo(3) : null,
      createdAt: daysAgo(7),
    }))
  )

  // ── Reviews ──────────────────────────────────────────────────────────────────
  console.log('  → reviews')

  const completedBookings = bookingRows.filter(b => b.status === 'completed')
  const comments = [
    'Amazing session! My child loved every minute of it.',
    'Teacher was very patient and engaging. Will book again.',
    'Great learning experience. Highly recommend!',
    'My child has improved so much in just a few sessions.',
    'Wonderful teacher who really connects with children.',
    'The session was fun and educational. Perfect balance.',
    'My daughter asks for more sessions every week!',
    'Very professional and caring. 5 stars!',
    'Good session but could be a bit more structured.',
    'Decent class. My son enjoyed it.',
  ]

  await db.insert(schema.reviews).values(
    completedBookings.slice(0, 18).map((b, i) => ({
      bookingId: b.id,
      parentId: b.parentId,
      teacherId: b.teacherId!,
      activityId: b.activityId,
      rating: i < 15 ? (4 + (i % 2)) : (2 + (i % 2)),
      comment: comments[i % comments.length],
      isFlagged: i >= 15,
      createdAt: daysAgo(i + 1),
    }))
  )

  // ── Discount Codes ───────────────────────────────────────────────────────────
  console.log('  → discount codes')

  await db.insert(schema.discountCodes).values([
    {
      code: 'BEAM50',
      type: 'flat',
      value: '50',
      minOrderAmount: '300',
      maxUses: 500,
      usedCount: 127,
      isActive: true,
      expiresAt: daysFromNow(30),
    },
    {
      code: 'WELCOME20',
      type: 'percent',
      value: '20',
      minOrderAmount: '500',
      maxUses: 1000,
      usedCount: 342,
      isActive: true,
      expiresAt: daysFromNow(60),
    },
    {
      code: 'SUMMER100',
      type: 'flat',
      value: '100',
      minOrderAmount: '700',
      maxUses: 200,
      usedCount: 198,
      isActive: true,
      expiresAt: daysFromNow(15),
    },
    {
      code: 'FIRSTBEAM',
      type: 'percent',
      value: '15',
      minOrderAmount: '0',
      isActive: true,
      expiresAt: daysFromNow(90),
    },
    {
      code: 'MONSOON30',
      type: 'flat',
      value: '30',
      minOrderAmount: '400',
      maxUses: 100,
      usedCount: 100,
      isActive: false,
    },
  ])

  // ── Notifications ────────────────────────────────────────────────────────────
  console.log('  → notifications')

  await db.insert(schema.notifications).values(
    parentUsers.slice(0, 8).map((u, i) => ({
      userId: u.id,
      type: randomFrom(['booking_confirmed', 'session_reminder', 'session_completed', 'payment_success']),
      title: randomFrom([
        'Booking Confirmed!',
        'Session starting in 1 hour',
        'Session completed — share your feedback',
        'Payment successful',
      ]),
      body: 'Tap to view your booking details.',
      isRead: i % 3 === 0,
      createdAt: daysAgo(i),
    }))
  )

  // ── Audit Logs ───────────────────────────────────────────────────────────────
  console.log('  → audit logs')

  const adminUser = await db.query.users.findFirst({
    where: eq(schema.users.email, 'admin@beam.co'),
  })

  if (adminUser) {
    await db.insert(schema.auditLogs).values([
      {
        actorId: adminUser.id,
        actorRole: 'admin',
        action: 'teacher.verified',
        entityType: 'teacher',
        entityId: teacherUserRows[0].id,
        after: { verificationStatus: 'verified' },
        createdAt: daysAgo(5),
      },
      {
        actorId: adminUser.id,
        actorRole: 'admin',
        action: 'booking.cancelled',
        entityType: 'booking',
        entityId: bookingRows[0].id,
        before: { status: 'confirmed' },
        after: { status: 'cancelled', reason: 'Parent request' },
        createdAt: daysAgo(3),
      },
      {
        actorId: adminUser.id,
        actorRole: 'admin',
        action: 'activity.published',
        entityType: 'activity',
        entityId: activityRows[0].id,
        before: { status: 'draft' },
        after: { status: 'published' },
        createdAt: daysAgo(7),
      },
    ])
  }

  console.log('✅ Seed complete!')
  await client.end()
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
