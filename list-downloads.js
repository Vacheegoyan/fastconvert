const fs = require('fs');
const p = './downloads';
if (!fs.existsSync(p)) { console.log(JSON.stringify([])); process.exit(0); }
const files = fs.readdirSync(p).map(f => ({ name: f, size: fs.statSync(p+'/'+f).size }));
console.log(JSON.stringify(files, null, 2));
