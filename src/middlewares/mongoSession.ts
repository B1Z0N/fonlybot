import { mongoose } from '@typegoose/typegoose'
import { session } from 'telegraf-session-mongodb'

export function getMongoSession() {
  const { db } = mongoose.connection
  return session(db)
}
