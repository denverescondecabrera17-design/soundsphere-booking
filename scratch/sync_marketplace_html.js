const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../client/marketplace.html');
const targets = [
    path.join(__dirname, '../client/pages/marketplace.html'),
    path.join(__dirname, '../client/client/dashboard.html'),
    path.join(__dirname, '../public/marketplace.html'),
    path.join(__dirname, '../public/pages/marketplace.html'),
    path.join(__dirname, '../public/client/dashboard.html')
];

const content = fs.readFileSync(srcPath, 'utf8');

targets.forEach(target => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, content, 'utf8');
    console.log(`Synced marketplace.html -> ${target}`);
});

console.log("✅ All marketplace HTML files synchronized successfully!");
