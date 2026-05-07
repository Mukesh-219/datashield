import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    // Scan that produced this alert
    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scan",
      required: true,
    },

    // Type of detected attack
    attackType: {
      type: String,
      enum: ["SQLi", "Stored XSS", "Reflected XSS", "DOM XSS", "Suspicious"],
      required: [true, "attackType is required"],
    },

    // Suspicious input/payload that triggered the alert
    payload: {
      type: String,
      required: [true, "payload is required"],
      trim: true,
    },

    // Endpoint where the issue was detected
    endpoint: {
      type: String,
      required: [true, "endpoint is required"],
      trim: true,
    },

    // Final computed risk score (0 to 10)
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },

    // Risk level derived from riskScore
    severity: {
      type: String,
      enum: ["informational", "medium", "high", "critical"],
      required: true,
    },

    // ML model confidence (0.0 to 1.0)
    mlConfidence: {
      type: Number,
      required: [true, "mlConfidence is required"],
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
