import scanTarget from './vulnerabilityScanner.js';

const normalizeAttackType = (attackType) => {
  if (!attackType) return 'Unknown';
  const normalized = String(attackType).trim();
  if (normalized === 'XSS') return 'Reflected XSS';
  return normalized;
};

export function mapSeverityAndRisk(attackType) {
  const normalizedAttackType = normalizeAttackType(attackType);

  switch (normalizedAttackType) {
    case 'SQLi':
      return { severity: 'critical', riskScore: 9.0 };
    case 'Reflected XSS':
      return { severity: 'high', riskScore: 8.0 };
    case 'PathTraversal':
      return { severity: 'critical', riskScore: 9.5 };
    case 'CommandInjection':
      return { severity: 'critical', riskScore: 10.0 };
    case 'InfoDisclosure':
      return { severity: 'medium', riskScore: 6.0 };
    default:
      return { severity: 'low', riskScore: 3.0 };
  }
}

export function normalizeFinding(finding) {
  if (!finding || typeof finding !== 'object') {
    return null;
  }

  const attackType = normalizeAttackType(finding.attackType || 'Unknown');
  const { severity, riskScore } = mapSeverityAndRisk(attackType);

  return {
    attackType,
    endpoint: finding.endpoint || finding.path || '/',
    payload: finding.payload || '',
    confidence: typeof finding.confidence === 'number' ? finding.confidence : 0,
    severity,
    riskScore,
    evidence: finding.evidence || '',
  };
}

export async function runScanner(targetUrl, options = {}) {
  const maxEndpoints = Number(process.env.SCANNER_MAX_ENDPOINTS) || 10;
  const maxPerCategory = Number(process.env.SCANNER_MAX_PAYLOADS_PER_CATEGORY) || 3;
  const timeoutMs = Number(process.env.SCANNER_TIMEOUT_MS) || 30000;

  const scanResult = await scanTarget(targetUrl, {
    maxEndpoints: options.maxEndpoints || maxEndpoints,
    maxPerCategory: options.maxPerCategory || maxPerCategory,
    timeoutMs: options.timeoutMs || timeoutMs,
  });

  const vulnerabilities = Array.isArray(scanResult.findings)
    ? scanResult.findings.map(normalizeFinding).filter(Boolean)
    : [];

  return {
    success: !!scanResult.success,
    targetUrl,
    scannedEndpoints: typeof scanResult.scannedEndpoints === 'number' ? scanResult.scannedEndpoints : 0,
    vulnerabilities,
  };
}

export default runScanner;
