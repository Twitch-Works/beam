import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  integer,
  boolean,
  pgEnum,
  jsonb,
  date,
  time,
  real,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['parent', 'teacher', 'admin', 'super_admin'])
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'verified', 'rejected'])
export const sessionTypeEnum = pgEnum('session_type', ['1:1', 'group'])
export const activityStatusEnum = pgEnum('activity_status', ['draft', 'published', 'archived'])
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'success', 'failed', 'refunded'])
export const paymentGatewayEnum = pgEnum('payment_gateway', ['razorpay', 'upi', 'card', 'netbanking', 'wallet'])
export const payoutStatusEnum = pgEnum('payout_status', ['queued', 'dispatched', 'settled', 'failed'])
export const notificationChannelEnum = pgEnum('notification_channel', ['push', 'whatsapp', 'email', 'in_app'])
export const discountTypeEnum = pgEnum('discount_type', ['flat', 'percent'])

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  city: text('city'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const usersRelations = relations(users, ({ many, one }) => ({
  children: many(children),
  teacher: one(teachers, { fields: [users.id], references: [teachers.userId] }),
  bookingsAsParent: many(bookings, { relationName: 'parentBookings' }),
  bookingsAsTeacher: many(bookings, { relationName: 'teacherBookings' }),
  payments: many(payments),
  payouts: many(payouts),
  reviewsAsParent: many(reviews, { relationName: 'parentReviews' }),
  reviewsAsTeacher: many(reviews, { relationName: 'teacherReviews' }),
  notifications: many(notifications),
}))

// ─── Children ─────────────────────────────────────────────────────────────────

export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  dateOfBirth: date('date_of_birth').notNull(),
  interests: text('interests').array().notNull().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(users, { fields: [children.parentId], references: [users.id] }),
  bookings: many(bookings),
}))

// ─── Teachers ─────────────────────────────────────────────────────────────────

export const teachers = pgTable('teachers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  specializations: text('specializations').array().notNull().default([]),
  verificationStatus: verificationStatusEnum('verification_status').notNull().default('pending'),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  bankAccountJson: jsonb('bank_account_json'),
  availabilityJson: jsonb('availability_json'),
  documents: jsonb('documents').default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const teachersRelations = relations(teachers, ({ one }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
}))

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#1787A6'),
  icon: text('icon'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const categoriesRelations = relations(categories, ({ many }) => ({
  activities: many(activities),
}))

// ─── Activities ───────────────────────────────────────────────────────────────

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  ageGroup: text('age_group').notNull(),
  sessionType: sessionTypeEnum('session_type').notNull().default('1:1'),
  minChildren: integer('min_children').notNull().default(1),
  maxChildren: integer('max_children').notNull().default(1),
  sessionDurationMins: integer('session_duration_mins').notNull().default(60),
  pricePerSession: numeric('price_per_session', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  tags: text('tags').array().notNull().default([]),
  materialsNeeded: text('materials_needed'),
  preparationNotes: text('preparation_notes'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  status: activityStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  category: one(categories, { fields: [activities.categoryId], references: [categories.id] }),
  slots: many(slots),
  bookings: many(bookings),
  reviews: many(reviews),
}))

// ─── Slots ────────────────────────────────────────────────────────────────────

export const slots = pgTable('slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  activityId: uuid('activity_id').notNull().references(() => activities.id),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  lockedByBookingId: uuid('locked_by_booking_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const slotsRelations = relations(slots, ({ one }) => ({
  teacher: one(users, { fields: [slots.teacherId], references: [users.id] }),
  activity: one(activities, { fields: [slots.activityId], references: [activities.id] }),
}))

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').notNull().references(() => users.id),
  childId: uuid('child_id').notNull().references(() => children.id),
  teacherId: uuid('teacher_id').references(() => users.id),
  activityId: uuid('activity_id').notNull().references(() => activities.id),
  slotId: uuid('slot_id').references(() => slots.id),
  status: bookingStatusEnum('status').notNull().default('pending'),
  sessionType: sessionTypeEnum('session_type').notNull().default('1:1'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  discountCode: text('discount_code'),
  notes: text('notes'),
  scheduledAt: timestamp('scheduled_at'),
  confirmedAt: timestamp('confirmed_at'),
  teacherOtp: text('teacher_otp'),
  teacherOtpGeneratedAt: timestamp('teacher_otp_generated_at'),
  teacherOtpVerifiedAt: timestamp('teacher_otp_verified_at'),
  completedAt: timestamp('completed_at'),
  parentCompletedAt: timestamp('parent_completed_at'),
  payoutQueuedAt: timestamp('payout_queued_at'),
  payoutReleasedAt: timestamp('payout_released_at'),
  lastWhatsAppSentAt: timestamp('last_whatsapp_sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  parent: one(users, { fields: [bookings.parentId], references: [users.id], relationName: 'parentBookings' }),
  teacher: one(users, { fields: [bookings.teacherId], references: [users.id], relationName: 'teacherBookings' }),
  child: one(children, { fields: [bookings.childId], references: [children.id] }),
  activity: one(activities, { fields: [bookings.activityId], references: [activities.id] }),
  slot: one(slots, { fields: [bookings.slotId], references: [slots.id] }),
  payment: one(payments),
  review: one(reviews),
}))

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().unique().references(() => bookings.id),
  parentId: uuid('parent_id').notNull().references(() => users.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  gateway: paymentGatewayEnum('gateway').notNull().default('razorpay'),
  razorpayOrderId: text('razorpay_order_id'),
  gatewayPaymentId: text('gateway_payment_id'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  refundedAt: timestamp('refunded_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  parent: one(users, { fields: [payments.parentId], references: [users.id] }),
}))

// ─── Payouts ──────────────────────────────────────────────────────────────────

export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  sessionCount: integer('session_count').notNull().default(0),
  bookingIds: uuid('booking_ids').array().notNull().default([]),
  status: payoutStatusEnum('status').notNull().default('queued'),
  bankAccount: text('bank_account'),
  scheduledAt: timestamp('scheduled_at'),
  settledAt: timestamp('settled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const payoutsRelations = relations(payouts, ({ one }) => ({
  teacher: one(users, { fields: [payouts.teacherId], references: [users.id] }),
}))

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().unique().references(() => bookings.id),
  parentId: uuid('parent_id').notNull().references(() => users.id),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  activityId: uuid('activity_id').notNull().references(() => activities.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  isFlagged: boolean('is_flagged').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, { fields: [reviews.bookingId], references: [bookings.id] }),
  parent: one(users, { fields: [reviews.parentId], references: [users.id], relationName: 'parentReviews' }),
  teacher: one(users, { fields: [reviews.teacherId], references: [users.id], relationName: 'teacherReviews' }),
  activity: one(activities, { fields: [reviews.activityId], references: [activities.id] }),
}))

// ─── Discount Codes ───────────────────────────────────────────────────────────

export const discountCodes = pgTable('discount_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  type: discountTypeEnum('type').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').notNull().default(0),
  validFrom: timestamp('valid_from'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  data: jsonb('data'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  readAt: timestamp('read_at'),
})

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}))

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id),
  actorRole: userRoleEnum('actor_role'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  before: jsonb('before'),
  after: jsonb('after'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
