import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'auth_register.json'), 'utf8'));

const url = 'http://localhost:5000/api/auth/register';

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const text = await res.text();
  console.log('STATUS', res.status);
  console.log(text);
} catch (err) {
  console.error('ERROR', err);
}
