import { Router } from "express";
import authController from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = Router();

// Register a new user
router.post("/register", authController.registerUser);

// Login existing user
router.post("/login", authController.loginUser);

// Get current authenticated user
router.get("/me", protect, authController.getMe);

export default router;
