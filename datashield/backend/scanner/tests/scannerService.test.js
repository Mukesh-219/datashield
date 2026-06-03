import express from 'express';
import http from 'http';
import assert from 'assert';
import runScanner, { mapSeverityAndRisk, normalizeFinding } from '../scannerService.js';

const createMockServer = () => {
  const app = express();
  app.use(express.json());

  app.get('/', (req, res) => {
    res.send(`
      <html>
        <body>
          <a href="/sql">sql</a>
          <a href="/xss">xss</a>
          <a href="/info">info</a>
          <form action="/login" method="POST">
            <input type="text" name="username" />
            <input type="password" name="password" />
            <button type="submit">Login</button>
          </form>
        </body>
      </html>
    `);
  });

  app.get('/sql', (req, res) => {
    res.send('Error: SQL syntax near "SELECT". mysql_fetch_assoc failed. SQLSTATE[42000]');
  });

  app.get('/xss', (req, res) => {
    const q = req.query.q || '';
    res.send(`Reflected: ${q}`);
  });

  app.post('/login', (req, res) => {
    const username = req.body.username || '';
    if (username.includes("' OR 1=1 --")) {
      return res.send('Error: SQL syntax near "SELECT". mysql_fetch_assoc failed. SQLSTATE[42000]');
    }
    return res.send('Login successful');
  });

  app.get('/info', (req, res) => {
    res.send('Unhandled exception: NullPointerException at com.example.Main (line 42)\nStack trace follows...');
  });

  return http.createServer(app);
};

const createSafeServer = () => {
  const app = express();
  app.get('/', (req, res) => {
    res.send('<html><body><a href="/home">home</a></body></html>');
  });
  app.get('/home', (req, res) => {
    res.send('<html><body>All good</body></html>');
  });
  return http.createServer(app);
};

(async () => {
  console.log('Running scanner service tests...');

  const server = createMockServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    const result = await runScanner(base);

    assert(result && typeof result === 'object', 'runScanner should return an object');
    assert(Array.isArray(result.vulnerabilities), 'Vulnerabilities array returned');
    console.log('✓ Vulnerabilities array returned');

    assert.deepStrictEqual(mapSeverityAndRisk('SQLi'), { severity: 'critical', riskScore: 9.0 });
    assert.deepStrictEqual(mapSeverityAndRisk('XSS'), { severity: 'high', riskScore: 8.0 });
    assert.deepStrictEqual(mapSeverityAndRisk('PathTraversal'), { severity: 'critical', riskScore: 9.5 });
    assert.deepStrictEqual(mapSeverityAndRisk('CommandInjection'), { severity: 'critical', riskScore: 10.0 });
    assert.deepStrictEqual(mapSeverityAndRisk('InfoDisclosure'), { severity: 'medium', riskScore: 6.0 });
    assert.deepStrictEqual(mapSeverityAndRisk('UnknownType'), { severity: 'low', riskScore: 3.0 });
    console.log('✓ Severity mapping works');
    console.log('✓ Risk score mapping works');

    const sqliFinding = normalizeFinding({
      attackType: 'SQLi',
      endpoint: '/sql',
      payload: "' OR 1=1 --",
      confidence: 0.95,
      evidence: 'SQL syntax',
    });
    assert.strictEqual(sqliFinding.severity, 'critical');
    assert.strictEqual(sqliFinding.riskScore, 9.0);
    console.log('✓ SQLi mapped correctly');

    const xssFinding = normalizeFinding({
      attackType: 'XSS',
      endpoint: '/xss',
      payload: '<script>alert(1)</script>',
      confidence: 0.9,
      evidence: 'reflected payload',
    });
    assert.strictEqual(xssFinding.severity, 'high');
    assert.strictEqual(xssFinding.riskScore, 8.0);
    console.log('✓ XSS mapped correctly');

    const pathFinding = normalizeFinding({
      attackType: 'PathTraversal',
      endpoint: '/path',
      payload: '../../etc/passwd',
      confidence: 0.9,
      evidence: 'root:x:',
    });
    assert.strictEqual(pathFinding.severity, 'critical');
    assert.strictEqual(pathFinding.riskScore, 9.5);
    console.log('✓ PathTraversal mapped correctly');

    const cmdFinding = normalizeFinding({
      attackType: 'CommandInjection',
      endpoint: '/cmd',
      payload: '&& whoami',
      confidence: 0.9,
      evidence: 'uid=0',
    });
    assert.strictEqual(cmdFinding.severity, 'critical');
    assert.strictEqual(cmdFinding.riskScore, 10.0);
    console.log('✓ CommandInjection mapped correctly');

    const infoFinding = normalizeFinding({
      attackType: 'InfoDisclosure',
      endpoint: '/info',
      payload: 'debug',
      confidence: 0.8,
      evidence: 'stack trace',
    });
    assert.strictEqual(infoFinding.severity, 'medium');
    assert.strictEqual(infoFinding.riskScore, 6.0);
    console.log('✓ InfoDisclosure mapped correctly');

    assert(result.vulnerabilities.length > 0, 'runScanner should discover vulnerabilities');

    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const safeServer = createSafeServer();
    await new Promise((resolve) => safeServer.listen(0, resolve));
    const safePort = safeServer.address().port;
    const safeBase = `http://127.0.0.1:${safePort}`;

    const safeResult = await runScanner(safeBase);
    assert(Array.isArray(safeResult.vulnerabilities), 'Empty scan returned vulnerabilities array');
    assert.strictEqual(safeResult.vulnerabilities.length, 0, 'Empty scan handled gracefully');
    console.log('✓ Empty scan handled gracefully');

    await new Promise((resolve, reject) => {
      safeServer.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    console.log('\nAll scanner service tests passed ✅');
    process.exit(0);
  } catch (err) {
    console.error('\nScanner service test failed ❌');
    console.error(err);
    await new Promise((resolve) => server.close(resolve));
    process.exit(1);
  }
})();
