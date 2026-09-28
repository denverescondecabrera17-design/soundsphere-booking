const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../client/pages/js/profile-modal.js');
const targets = [
    path.join(__dirname, '../client/js/profile-modal.js'),
    path.join(__dirname, '../public/pages/js/profile-modal.js'),
    path.join(__dirname, '../public/js/profile-modal.js')
];

const content = fs.readFileSync(srcPath, 'utf8');

targets.forEach(target => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, content, 'utf8');
    console.log(`Synced profile-modal.js -> ${target}`);
});

console.log("✅ All profile-modal.js files synchronized successfully!");
