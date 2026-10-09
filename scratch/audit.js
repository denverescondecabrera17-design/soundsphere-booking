const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getHtmlFiles(fullPath));
        } else if (file.endsWith('.html')) {
            results.push(fullPath);
        }
    });
    return results;
}

const publicDir = path.join(__dirname, '..', 'public');
const htmlFiles = getHtmlFiles(publicDir);

const auditResults = [];

htmlFiles.forEach(file => {
    const rel = path.relative(publicDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    
    // CSS links
    const cssMatches = [];
    const linkRegex = /<link\s+[^>]*rel=["']stylesheet["'][^>]*>|<link\s+[^>]*href=["']([^'"]+\.css[^'"]*)["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
        const fullLink = match[0];
        const hrefMatch = fullLink.match(/href=["']([^'"]+)["']/i);
        if (hrefMatch) {
            cssMatches.push(hrefMatch[1]);
        }
    }
    
    // Style tags
    const styleMatches = [];
    const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let sMatch;
    while ((sMatch = styleRegex.exec(content)) !== null) {
        styleMatches.push(sMatch[1].trim().substring(0, 80).replace(/\n/g, ' ') + '...');
    }
    
    // Viewport
    const hasViewport = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i.test(content);
    
    auditResults.push({
        file: rel,
        css: cssMatches,
        styleCount: styleMatches.length,
        stylePreviews: styleMatches,
        hasViewport
    });
});

fs.writeFileSync(path.join(__dirname, 'audit.json'), JSON.stringify(auditResults, null, 2));
console.log('Total HTML files in public:', auditResults.length);
auditResults.forEach(r => {
    const cssLocal = r.css.filter(c => !c.includes('googleapis') && !c.includes('cdnjs')).join(', ');
    console.log(`${r.file.padEnd(32)} | CSS: ${cssLocal.padEnd(60)} | InlineStyles: ${r.styleCount} | Viewport: ${r.hasViewport}`);
});

