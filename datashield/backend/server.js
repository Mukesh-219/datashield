import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initializeSocket } from "./socket/socket.js";

// Load environment variables from .env
dotenv.config();

// Define server port
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Wrap Express app with Node HTTP server so Socket.IO can share same port.
    const httpServer = http.createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    initializeSocket(io);

    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`Server + Socket.IO running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
