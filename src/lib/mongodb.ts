import mongoose from "mongoose";

declare global {
  var _mongoosePromise: Promise<typeof mongoose> | null;
}

global._mongoosePromise = global._mongoosePromise ?? null;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Please define the MONGODB_URI environment variable.");

  if (mongoose.connection.readyState >= 1) return mongoose;

  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose.connect(uri, { bufferCommands: false });
  }

  return global._mongoosePromise;
}
