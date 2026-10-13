const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const jsFiles = [
    path.join(rootDir, 'public', 'provider', 'js', 'provider-dashboard.js'),
    path.join(rootDir, 'public', 'pages', 'provider', 'js', 'provider-dashboard.js'),
    path.join(rootDir, 'client', 'provider', 'js', 'provider-dashboard.js'),
    path.join(rootDir, 'client', 'pages', 'provider', 'js', 'provider-dashboard.js')
];

jsFiles.forEach(f => {
    if (!fs.existsSync(f)) return;
    let js = fs.readFileSync(f, 'utf8');
    // Remove the extra trailing closing braces
    js = js.replace(/initModalDropzone\(\);\s*\}\s*\}\s*\}\);\s*\}\s*$/m, 'initModalDropzone();\n    }\n');
    fs.writeFileSync(f, js, 'utf8');
});
console.log('Fixed braces');
