import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    // URL that the user wants to scan
    targetUrl: {
      type: String,
      required: [true, "Target URL is required"],
      trim: true,
    },

    // Optional request endpoint scanned
    endpoint: {
      type: String,
      trim: true,
      default: "",
    },

    // Optional payload used for ML analysis
    payload: {
      type: String,
      trim: true,
      default: "",
    },

    // Stores last ML classification for this scan
    mlPrediction: {
      type: String,
      default: "",
    },

    // Stores last ML confidence score for this scan
    mlConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    // Current processing state of the scan
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },

    // User who started this scan
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Number of alerts found during the scan
    alertCount: {
      type: Number,
      default: 0,
    },

    // Highest risk score found during the scan
    maxRiskScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Scan = mongoose.model("Scan", scanSchema);

export default Scan;
