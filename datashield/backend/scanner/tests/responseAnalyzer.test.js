import assert from 'assert';
import analyzeResponse, {
  detectSQLi,
  detectXSS,
  detectPathTraversal,
  detectCommandInjection,
  detectInfoDisclosure,
} from '../responseAnalyzer.js';

const log = console.log;

try {
  log('Running response analyzer tests...');

  // 1. SQL error response
  const sqlBody = 'Error: SQL syntax near \"SELECT\". mysql_fetch_assoc failed. SQLSTATE[42000]';
  const sqlRes = analyzeResponse(sqlBody, "' OR 1=1 --");
  assert(sqlRes.vulnerable === true, 'SQL response should be flagged');
  assert(sqlRes.attackType === 'SQLi', 'Attack type should be SQLi');
  log('SQL detection:', sqlRes.attackType, sqlRes.confidence, sqlRes.evidence);

  // 2. XSS reflection
  const payload = '<script>alert(1)</script>';
  const xssBody = `User input: ${payload} displayed here`;
  const xssRes = analyzeResponse(xssBody, payload);
  assert(xssRes.vulnerable === true, 'XSS response should be flagged');
  assert(xssRes.attackType === 'XSS', 'Attack type should be XSS');
  log('XSS detection:', xssRes.attackType, xssRes.confidence, xssRes.evidence);

  // 3. Path traversal
  const pathBody = 'root:x:0:0:root:/root:/bin/bash\n/etc/passwd content follows...';
  const pathRes = analyzeResponse(pathBody, '../../etc/passwd');
  assert(pathRes.vulnerable === true, 'Path traversal should be flagged');
  assert(pathRes.attackType === 'PathTraversal', 'Attack type should be PathTraversal');
  log('Path detection:', pathRes.attackType, pathRes.confidence, pathRes.evidence);

  // 4. Command injection
  const cmdBody = 'uid=0(root) gid=0(root) groups=0(root)';
  const cmdRes = analyzeResponse(cmdBody, '; ls');
  assert(cmdRes.vulnerable === true, 'Command injection should be flagged');
  assert(cmdRes.attackType === 'CommandInjection', 'Attack type should be CommandInjection');
  log('Command detection:', cmdRes.attackType, cmdRes.confidence, cmdRes.evidence);

  // 5. Info disclosure
  const infoBody = 'Unhandled exception: NullPointerException at com.example.Main (line 42)\nStack trace follows...';
  const infoRes = analyzeResponse(infoBody, 'test');
  assert(infoRes.vulnerable === true, 'Info disclosure should be flagged');
  assert(infoRes.attackType === 'InfoDisclosure', 'Attack type should be InfoDisclosure');
  log('Info detection:', infoRes.attackType, infoRes.confidence, infoRes.evidence);

  // 6. Safe response
  const safeBody = '<html><body>Welcome to our site. No errors here.</body></html>';
  const safeRes = analyzeResponse(safeBody, '<script>alert(1)</script>');
  assert(safeRes.vulnerable === false, 'Safe response should not be flagged');
  log('Safe detection: vulnerable=false');

  log('\nAll response analyzer tests passed ✅');
  process.exit(0);
} catch (err) {
  console.error('\nTest failed ❌');
  console.error(err);
  process.exit(1);
}
