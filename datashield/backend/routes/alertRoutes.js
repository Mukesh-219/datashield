import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import alertController from "../controllers/alertController.js";

const router = Router();

// Create a new alert for a scan
router.post("/", protect, alertController.createAlert);

// Get all alerts for authenticated user's scans
router.get("/", protect, alertController.getAllAlerts);

// Get alerts for one scan
router.get("/scan/:scanId", protect, alertController.getAlertsByScan);

export default router;
