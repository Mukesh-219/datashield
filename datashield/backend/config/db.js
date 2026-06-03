import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Support both variable names to keep setup beginner-friendly
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

    const uriLoaded = !!mongoURI;
    const sanitizedURI = mongoURI
      ? mongoURI.replace(/mongodb\+srv:\/\/[^@]+@/, "mongodb+srv://***@")
      : "<missing>";
    const host = mongoURI && mongoURI.includes("@")
      ? mongoURI.split("@")[1].split("/")[0]
      : "unknown";

    console.log("MongoDB URI loaded:", uriLoaded);
    console.log("MongoDB host:", host);
    console.log("MongoDB URI sample:", sanitizedURI);
    console.log("MongoDB connection type:", mongoURI?.startsWith("mongodb+srv://") ? "SRV" : "standard");

    if (!mongoURI) {
      throw new Error("MONGODB_URI (or MONGO_URI) is missing in environment variables.");
    }

    const connection = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    console.log(`MongoDB readyState: ${connection.connection.readyState}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
