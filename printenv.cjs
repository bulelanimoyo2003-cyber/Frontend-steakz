require('dotenv').config();
const fs = require('fs');
const out = `DB_URL=${process.env.DATABASE_URL}\nCWD=${process.cwd()}\n`;
fs.writeFileSync('printenv.txt', out);
console.log('wrote printenv.txt');
