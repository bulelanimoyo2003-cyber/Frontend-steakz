const http = require('http');
const fs = require('fs');
const url = 'http://127.0.0.1:3001/api/public/branches';
const outPath = 'health.txt';
const timeout = 5000;
const req = http.get(url, (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    fs.writeFileSync(outPath, `STATUS:${res.statusCode}\nBODY:${body}`);
  });
});
req.on('error', (err) => {
  fs.writeFileSync(outPath, `ERROR:${err.message}`);
});
req.setTimeout(timeout, () => {
  req.destroy(new Error('timeout'));
});
