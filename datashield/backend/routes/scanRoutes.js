import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import scanController from "../controllers/scanController.js";

const router = Router();

// Create a new scan
router.post("/", protect, scanController.createScan);

// Get all scans for the logged-in user
router.get("/", protect, scanController.getScans);

// Get one scan by id (only if it belongs to logged-in user)
router.get("/:id", protect, scanController.getScanById);

export default router;
