import * as mongoose from 'mongoose'

// Mongoose buffers all the commands until it's connected to the database. 
// We don't have to wait until it connects to MongoDB in order to define models, 
// run queries, etc.
export async function mongoConnect() {
    await mongoose.connect(process.env.MONGO)
}

export * from './User'
