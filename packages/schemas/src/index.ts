export * from './user.schema'
export * from './booking.schema'
export * from './activity.schema'
export * from './slot.schema'
export * from './payment.schema'
export * from './review.schema'
export * from './discount.schema'
export * from './notification.schema'

import * as userSchemas from './user.schema'
import * as bookingSchemas from './booking.schema'
import * as activitySchemas from './activity.schema'
import * as slotSchemas from './slot.schema'
import * as paymentSchemas from './payment.schema'
import * as reviewSchemas from './review.schema'
import * as discountSchemas from './discount.schema'
import * as notificationSchemas from './notification.schema'

const beamSchemas = {
  ...userSchemas,
  ...bookingSchemas,
  ...activitySchemas,
  ...slotSchemas,
  ...paymentSchemas,
  ...reviewSchemas,
  ...discountSchemas,
  ...notificationSchemas,
}

export default beamSchemas
