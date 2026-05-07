// Base risk values per attack type
const ATTACK_BASE_SCORES = {
  SQLi: 8.5,
  "Stored XSS": 8.0,
  "Reflected XSS": 6.5,
  "DOM XSS": 6.0,
  Suspicious: 4.0,
};

const getSeverityFromScore = (riskScore) => {
  if (riskScore <= 3.9) return "informational";
  if (riskScore <= 6.9) return "medium";
  if (riskScore <= 8.9) return "high";
  return "critical";
};

const calculateRiskData = (attackType, mlConfidence) => {
  const baseValue = ATTACK_BASE_SCORES[attackType];

  if (baseValue === undefined) {
    throw new Error("Unsupported attack type for risk scoring");
  }

  if (typeof mlConfidence !== "number" || Number.isNaN(mlConfidence)) {
    throw new Error("mlConfidence must be a valid number");
  }

  // Formula: riskScore = baseValue * mlConfidence
  const rawScore = baseValue * mlConfidence;

  // Keep score to 2 decimals and clamp within 0-10
  const riskScore = Math.max(0, Math.min(10, Number(rawScore.toFixed(2))));
  const severity = getSeverityFromScore(riskScore);

  return { riskScore, severity };
};

export default calculateRiskData;
