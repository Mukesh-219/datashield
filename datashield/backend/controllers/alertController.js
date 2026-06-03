import mongoose from "mongoose";
import Alert from "../models/Alert.js";
import Scan from "../models/Scan.js";
import calculateRiskData from "../services/riskScoringService.js";
import { getSocket } from "../socket/socket.js";

// @desc    Create a new alert for a scan
// @route   POST /api/alerts
// @access  Private
const createAlert = async (req, res, next) => {
  try {
    const { scan, attackType, payload, endpoint, mlConfidence } = req.body;

    if (!scan || !attackType || !payload || !endpoint || mlConfidence === undefined) {
      return res.status(400).json({
        success: false,
        message: "scan, attackType, payload, endpoint, and mlConfidence are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(scan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scan ID format",
      });
    }

    if (typeof mlConfidence !== "number" || mlConfidence < 0 || mlConfidence > 1) {
      return res.status(400).json({
        success: false,
        message: "mlConfidence must be a number between 0 and 1",
      });
    }

    const targetScan = await Scan.findOne({
      _id: scan,
      initiatedBy: req.user._id,
    });

    if (!targetScan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    const { riskScore, severity } = calculateRiskData(attackType, mlConfidence);

    const alert = await Alert.create({
      scan,
      attackType,
      payload,
      endpoint,
      mlConfidence,
      riskScore,
      severity,
    });

    targetScan.alertCount += 1;
    targetScan.maxRiskScore = Math.max(targetScan.maxRiskScore, riskScore);
    await targetScan.save();

    const io = getSocket();
    if (io) {
      io.emit("alertCreated", { alert });
      io.emit("alert:created", { alert });
    }

    return res.status(201).json({
      success: true,
      alert,
    });
  } catch (error) {
    if (error.message === "Unsupported attack type for risk scoring") {
      return res.status(400).json({
        success: false,
        message: "Invalid attackType",
      });
    }

    next(error);
  }
};

const getAlertsByScan = async (req, res, next) => {
  try {
    const { scanId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(scanId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scan ID format",
      });
    }

    const scan = await Scan.findOne({
      _id: scanId,
      initiatedBy: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    const alerts = await Alert.find({ scan: scanId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

const getAllAlerts = async (req, res, next) => {
  try {
    const userScans = await Scan.find({ initiatedBy: req.user._id }).select("_id");
    const scanIds = userScans.map((item) => item._id);

    const alerts = await Alert.find({ scan: { $in: scanIds } })
      .sort({ createdAt: -1 })
      .populate("scan", "targetUrl status initiatedBy endpoint payload");

    return res.status(200).json({
      success: true,
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createAlert,
  getAlertsByScan,
  getAllAlerts,
};
