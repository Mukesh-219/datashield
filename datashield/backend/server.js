// server.js

import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

// Load environment variables from .env
dotenv.config();

// Define server port
const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);

    // Exit process if startup fails
    process.exit(1);
  }
};

// Run server
startServer();