const fs = require('fs');
const urls = ['http://127.0.0.1:5173/api/public/branches'];
(async () => {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET' });
      const text = await res.text();
      fs.writeFileSync('probe.txt', `URL:${url}\nSTATUS:${res.status}\nBODY:${text}\n`);
      console.log('OK', url);
      return;
    } catch (e) {
      fs.writeFileSync('probe.txt', `ERROR:${e.message}\nURL:${url}\n`);
    }
  }
})();
