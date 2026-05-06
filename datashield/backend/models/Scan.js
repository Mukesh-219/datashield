import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    // URL that the user wants to scan
    targetUrl: {
      type: String,
      required: [true, "Target URL is required"],
      trim: true,
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
