import mongoose from "mongoose";
import Scan from "../models/Scan.js";
import Alert from "../models/Alert.js";
import calculateRiskData from "../services/riskScoringService.js";
import mlService from "../services/mlService.js";
import runScanner from "../scanner/scannerService.js";
import { getSocket } from "../socket/socket.js";

const isValidUrl = (value) => {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const mapMlPredictionToAttackType = (prediction) => {
  const normalized = String(prediction || "").trim();

  if (normalized === "SQLi") return "SQLi";
  if (normalized === "XSS") return "Reflected XSS";
  if (normalized === "Suspicious") return "Suspicious";
  if (normalized === "Normal") return null;

  return null;
};

const createScan = async (req, res, next) => {
  try {
    const { targetUrl, payload, endpoint } = req.body;

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        message: "targetUrl is required",
      });
    }

    if (!isValidUrl(targetUrl)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid URL starting with http:// or https://",
      });
    }

    const scan = await Scan.create({
      targetUrl,
      endpoint: endpoint || "",
      payload: payload || "",
      initiatedBy: req.user._id,
      status: "queued",
    });

    const scannerEnabled = process.env.ENABLE_SCANNER === "true";
    if (scannerEnabled && scan.status === "queued") {
      scan.status = "running";
      await scan.save();
    }

    let mlAnalysis = null;

    if (typeof payload === "string" && payload.trim()) {
      try {
        mlAnalysis = await mlService.predictPayloadThreat(payload);

        const attackType = mapMlPredictionToAttackType(mlAnalysis.prediction);
        const boundedConfidence = Number.isFinite(mlAnalysis.confidence)
          ? Math.max(0, Math.min(1, mlAnalysis.confidence))
          : 0;

        scan.mlPrediction = String(mlAnalysis.prediction || "");
        scan.mlConfidence = boundedConfidence;
        scan.status = "completed";

        if (attackType) {
          const { riskScore, severity } = calculateRiskData(attackType, boundedConfidence);

          const alert = await Alert.create({
            scan: scan._id,
            attackType,
            payload,
            endpoint: endpoint || targetUrl,
            mlConfidence: boundedConfidence,
            riskScore,
            severity,
          });

          scan.alertCount += 1;
          scan.maxRiskScore = Math.max(scan.maxRiskScore, riskScore);

          const io = getSocket();
          if (io) {
            io.emit("alertCreated", { alert });
            io.emit("alert:created", { alert });
          }
        }

        await scan.save();
      } catch (mlError) {
        scan.status = "failed";
        await scan.save();

        mlAnalysis = {
          success: false,
          message: mlError.message,
        };
      }
    }

    if (scannerEnabled) {
      void (async () => {
        let scannedScan;

        try {
          const scannerResult = await runScanner(targetUrl);
          scannedScan = await Scan.findById(scan._id);
          if (!scannedScan) return;

          const io = getSocket();
          const normalizeScannerAttackType = (type) => {
            if (!type) return type;
            if (String(type).trim() === "XSS") return "Reflected XSS";
            return String(type).trim();
          };

          for (const vulnerability of scannerResult.vulnerabilities || []) {
            const attackType = normalizeScannerAttackType(vulnerability.attackType);
            const endpointValue = vulnerability.endpoint || targetUrl;
            const vulnerabilityPayload = vulnerability.payload || "";
            const mlConfidence = typeof vulnerability.confidence === "number" ? vulnerability.confidence : 0;
            const { riskScore, severity } = calculateRiskData(attackType, mlConfidence);

            const alert = await Alert.create({
              scan: scannedScan._id,
              attackType,
              payload: vulnerabilityPayload || "[Scanner Generated Finding]",
              endpoint: endpointValue,
              mlConfidence,
              riskScore,
              severity,
            });

            scannedScan.alertCount += 1;
            scannedScan.maxRiskScore = Math.max(scannedScan.maxRiskScore, riskScore);
            if (io) {
              io.emit("alertCreated", { alert });
              io.emit("alert:created", { alert });
            }
          }

          if (scannedScan.status === "running") {
            scannedScan.status = "completed";
          }

          await scannedScan.save();
        } catch (scannerError) {
          console.error("Scanner integration failed:", scannerError);
          if (scannedScan && scannedScan.status === "running") {
            scannedScan.status = "completed";
            await scannedScan.save();
          }
        }
      })();
    }

    const io = getSocket();
    if (io) {
      io.emit("scanCreated", { scan });
      io.emit("scan:created", { scan });
    }

    return res.status(201).json({
      success: true,
      scan,
      mlAnalysis,
      scannerEnabled,
    });
  } catch (error) {
    next(error);
  }
};

const getScans = async (req, res, next) => {
  try {
    const scans = await Scan.find({ initiatedBy: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      scans,
    });
  } catch (error) {
    next(error);
  }
};

const getScanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scan ID format",
      });
    }

    const scan = await Scan.findOne({
      _id: id,
      initiatedBy: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    return res.status(200).json({
      success: true,
      scan,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createScan,
  getScans,
  getScanById,
};
