import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initializeSocket } from "./socket/socket.js";

// Load environment variables from .env
dotenv.config();

console.log("dotenv loaded:", !!(process.env.MONGODB_URI || process.env.MONGO_URI));
console.log("JWT_SECRET configured:", !!process.env.JWT_SECRET);
console.log("PORT configured:", process.env.PORT || "unset");

// Define server port
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  let httpServer;
  let io;

  const shutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down server...`);
    try {
      if (io) {
        await io.close();
      }
      if (httpServer && httpServer.listening) {
        await new Promise((resolve, reject) => {
          httpServer.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    } catch (shutdownError) {
      console.error("Error during shutdown:", shutdownError);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGUSR2", () => {
    shutdown("SIGUSR2").then(() => process.kill(process.pid, "SIGUSR2"));
  });

  try {
    await connectDB();

    // Wrap Express app with Node HTTP server so Socket.IO can share same port.
    httpServer = http.createServer(app);

    io = new Server(httpServer, {
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

    httpServer.on("error", (error) => {
      console.error("HTTP server error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Please stop the running process or choose a different port.`);
      }
      process.exit(1);
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
