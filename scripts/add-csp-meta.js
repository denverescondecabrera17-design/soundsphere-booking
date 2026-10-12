const fs = require('fs');
const path = require('path');

const clientDir = path.resolve(__dirname, '../client');
const cspTag = '    <meta http-equiv="Content-Security-Policy" content="default-src * \'unsafe-inline\' \'unsafe-eval\' data: blob:; script-src * \'unsafe-inline\' \'unsafe-eval\' data: blob:; style-src * \'unsafe-inline\'; img-src * data: blob:; font-src * data:; connect-src *; frame-src *; worker-src * blob: data:;">';

function getHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                results = results.concat(getHtmlFiles(fullPath));
            }
        } else if (file.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

const htmlFiles = getHtmlFiles(clientDir);
console.log(`Found ${htmlFiles.length} HTML files.`);

let updatedCount = 0;
for (const filePath of htmlFiles) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if CSP meta tag is already present
    if (content.includes('http-equiv="Content-Security-Policy"') || content.includes("http-equiv='Content-Security-Policy'")) {
        console.log(`[SKIPPED - already present] ${path.relative(clientDir, filePath)}`);
        continue;
    }
    
    // Insert right after <meta charset="UTF-8"> or after <head>
    if (content.includes('<meta charset="UTF-8">')) {
        content = content.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n' + cspTag);
        fs.writeFileSync(filePath, content, 'utf8');
        updatedCount++;
        console.log(`[UPDATED] ${path.relative(clientDir, filePath)}`);
    } else if (content.includes('<meta charset="utf-8">')) {
        content = content.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + cspTag);
        fs.writeFileSync(filePath, content, 'utf8');
        updatedCount++;
        console.log(`[UPDATED] ${path.relative(clientDir, filePath)}`);
    } else if (content.includes('<head>')) {
        content = content.replace('<head>', '<head>\n' + cspTag);
        fs.writeFileSync(filePath, content, 'utf8');
        updatedCount++;
        console.log(`[UPDATED] ${path.relative(clientDir, filePath)}`);
    } else {
        console.warn(`[WARNING - no head or charset] ${path.relative(clientDir, filePath)}`);
    }
}

console.log(`Successfully updated ${updatedCount} files.`);
