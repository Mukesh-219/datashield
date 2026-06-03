// Response Analyzer for detecting potential vulnerabilities in HTTP responses

export function detectSQLi(body) {
  if (!body) return null;
  const patterns = [
    /sql syntax/i,
    /mysql_fetch/i,
    /warning:\s*mysql/i,
    /sqlstate/i,
    /ora-/i,
    /postgresql error/i,
    /sqlite error/i,
    /database error/i,
  ];
  for (const p of patterns) {
    const m = body.match(p);
    if (m) {
      return {
        attackType: 'SQLi',
        confidence: 0.95,
        evidence: m[0],
      };
    }
  }
  return null;
}

export function detectXSS(body, payload) {
  if (!body || !payload) return null;
  // simple reflection check: payload substring appears in body (case-sensitive for payloads)
  try {
    if (typeof payload !== 'string') payload = String(payload);
  } catch (e) {
    payload = '';
  }
  if (!payload) return null;
  if (body.includes(payload)) {
    return {
      attackType: 'XSS',
      confidence: 0.9,
      evidence: `reflected payload: ${payload}`,
    };
  }
  // common XSS indicators
  const indicators = [/onerror=alert\(/i, /<script>/i, /javascript:alert\(/i, /<svg\/onload/i];
  for (const p of indicators) {
    const m = body.match(p);
    if (m) {
      return {
        attackType: 'XSS',
        confidence: 0.75,
        evidence: m[0],
      };
    }
  }
  return null;
}

export function detectPathTraversal(body) {
  if (!body) return null;
  const patterns = [/root:x:/i, /etc\/passwd/i, /boot.ini/i, /system32/i, /shadow file/i, /etc\/shadow/i];
  for (const p of patterns) {
    const m = body.match(p);
    if (m) {
      return {
        attackType: 'PathTraversal',
        confidence: 0.9,
        evidence: m[0],
      };
    }
  }
  return null;
}

export function detectCommandInjection(body) {
  if (!body) return null;
  const patterns = [/uid=\d+/i, /gid=\d+/i, /\broot\b/i, /\badministrator\b/i, /command output/i, /\bwhoami\b/i, /\buname -a\b/i];
  for (const p of patterns) {
    const m = body.match(p);
    if (m) {
      return {
        attackType: 'CommandInjection',
        confidence: 0.9,
        evidence: m[0],
      };
    }
  }
  return null;
}

export function detectInfoDisclosure(body) {
  if (!body) return null;
  const patterns = [/stack trace/i, /exception/i, /internal server error/i, /null pointer/i, /debug mode/i];
  for (const p of patterns) {
    const m = body.match(p);
    if (m) {
      return {
        attackType: 'InfoDisclosure',
        confidence: 0.8,
        evidence: m[0],
      };
    }
  }
  return null;
}

export function analyzeResponse(responseBody, payload) {
  const body = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody || '');

  const detectors = [
    detectSQLi,
    (b) => detectXSS(b, payload),
    detectPathTraversal,
    detectCommandInjection,
    detectInfoDisclosure,
  ];

  const findings = [];

  for (const d of detectors) {
    try {
      const res = d(body);
      if (res && res.attackType) findings.push(res);
    } catch (err) {
      // ignore detector errors to keep analysis robust
      console.error('Detector error:', err && err.message);
    }
  }

  if (findings.length === 0) return { vulnerable: false };

  // choose the finding with highest confidence
  findings.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  const top = findings[0];
  return {
    vulnerable: true,
    attackType: top.attackType,
    confidence: top.confidence,
    evidence: top.evidence,
    details: findings,
  };
}

export default analyzeResponse;
