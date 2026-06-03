import assert from 'assert';
import {
  SQLI_PAYLOADS,
  XSS_PAYLOADS,
  SUSPICIOUS_PAYLOADS,
  ALL_PAYLOADS,
  getPayloadsByType,
  getRandomPayload,
  getAllPayloads,
} from '../payloads.js';

const log = console.log;

try {
  log('Running payloads test...');

  // Expected counts based on implementation
  const expectedSQLiCount = SQLI_PAYLOADS.length;
  const expectedXSSCount = XSS_PAYLOADS.length;
  const expectedSuspiciousCount = SUSPICIOUS_PAYLOADS.length;

  // Basic existence
  assert(Array.isArray(SQLI_PAYLOADS), 'SQLI_PAYLOADS should be an array');
  assert(Array.isArray(XSS_PAYLOADS), 'XSS_PAYLOADS should be an array');
  assert(Array.isArray(SUSPICIOUS_PAYLOADS), 'SUSPICIOUS_PAYLOADS should be an array');

  log(`SQLi payloads count: ${expectedSQLiCount}`);
  log(`XSS payloads count: ${expectedXSSCount}`);
  log(`Suspicious payloads count: ${expectedSuspiciousCount}`);

  // Verify counts are greater than zero
  assert(expectedSQLiCount > 0, 'Expected at least one SQLi payload');
  assert(expectedXSSCount > 0, 'Expected at least one XSS payload');
  assert(expectedSuspiciousCount > 0, 'Expected at least one suspicious payload');

  // getPayloadsByType
  const sqliFromLookup = getPayloadsByType('SQLi');
  assert.deepStrictEqual(sqliFromLookup, SQLI_PAYLOADS, 'getPayloadsByType(SQLi) should return SQLI_PAYLOADS');

  const xssFromLookup = getPayloadsByType('xss');
  assert.deepStrictEqual(xssFromLookup, XSS_PAYLOADS, 'getPayloadsByType(xss) should return XSS_PAYLOADS');

  // getRandomPayload
  const randomSql = getRandomPayload('SQLi');
  assert(SQLI_PAYLOADS.includes(randomSql), 'Random SQLi payload should be from SQLI_PAYLOADS');

  const randomAny = getRandomPayload();
  const allConcat = Object.values(ALL_PAYLOADS).flat();
  assert(allConcat.includes(randomAny), 'Random payload (any) should be from combined payloads');

  // getAllPayloads
  const all = getAllPayloads();
  assert(all.SQLi === SQLI_PAYLOADS, 'getAllPayloads should include SQLi');

  log('\nAll tests passed ✅');
  process.exit(0);
} catch (err) {
  console.error('\nTest failed ❌');
  console.error(err);
  process.exit(1);
}
