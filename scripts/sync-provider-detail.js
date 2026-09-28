const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../client/js/provider-detail.js');
const targets = [
    path.join(__dirname, '../client/pages/js/provider-detail.js'),
    path.join(__dirname, '../public/js/provider-detail.js'),
    path.join(__dirname, '../public/pages/js/provider-detail.js')
];

const content = fs.readFileSync(srcPath, 'utf8');

targets.forEach(target => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, content, 'utf8');
    console.log(`Synced provider-detail.js -> ${target}`);
});

console.log("✅ All provider-detail.js files synchronized successfully!");
