import mongoose from "mongoose";
import Scan from "../models/Scan.js";

// Small helper to validate URL format safely
const isValidUrl = (value) => {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
};

// @desc    Create a new scan
// @route   POST /api/scans
// @access  Private
const createScan = async (req, res, next) => {
  try {
    const { targetUrl } = req.body;

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
      initiatedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      scan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all scans for authenticated user
// @route   GET /api/scans
// @access  Private
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

// @desc    Get one scan by id for authenticated user
// @route   GET /api/scans/:id
// @access  Private
const getScanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Return clean validation error for malformed MongoDB ids
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
