const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../client/provider/js/provider-dashboard.js');
const targets = [
    path.join(__dirname, '../client/pages/provider/js/provider-dashboard.js'),
    path.join(__dirname, '../public/provider/js/provider-dashboard.js'),
    path.join(__dirname, '../public/pages/provider/js/provider-dashboard.js')
];

const content = fs.readFileSync(srcPath, 'utf8');

targets.forEach(target => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, content, 'utf8');
    console.log(`Synced provider-dashboard.js -> ${target}`);
});

console.log("✅ All provider-dashboard.js files synchronized successfully!");
