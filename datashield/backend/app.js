import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

// Allow requests from other origins (frontend, tools, etc.)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Auth endpoints (register, login)
app.use("/api/auth", authRoutes);

// Scan endpoints (create scan, list scans, get single scan)
app.use("/api/scans", scanRoutes);

// Alert endpoints (create alert, list alerts, list alerts by scan)
app.use("/api/alerts", alertRoutes);

// Basic health-check endpoint to verify API is running
app.use("/api/health", healthRoutes);

// Handle unknown routes and centralized errors
app.use(notFound);
app.use(errorHandler);

export default app;
