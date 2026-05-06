import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Support both variable names to keep setup beginner-friendly
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI (or MONGO_URI) is missing in environment variables.");
    }

    const connection = await mongoose.connect(mongoURI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
