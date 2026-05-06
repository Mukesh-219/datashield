import { Router } from "express";

const router = Router();

// Simple health endpoint for uptime checks
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DataShield API is running",
  });
});

export default router;
