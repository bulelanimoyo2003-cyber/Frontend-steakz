const fs = require('fs');
const urls = [
  'http://127.0.0.1:5173/',
  'http://127.0.0.1:5173/branches',
  'http://127.0.0.1:5173/api/public/branches',
];
(async () => {
  const results = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET' });
      const text = await res.text();
      results.push({ url, status: res.status, len: text.length, sample: text.slice(0,200) });
    } catch (e) {
      results.push({ url, error: e.message });
    }
  }
  fs.writeFileSync('smoke.txt', JSON.stringify(results, null, 2));
  console.log('smoke done');
})();
