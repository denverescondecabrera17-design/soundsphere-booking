const http = require('http');

http.get('http://localhost:5000/api/providers', (res) => {
    let rawData = '';
    res.on('data', chunk => rawData += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(rawData);
            console.log("=== API PROVIDERS RESPONSE ===");
            console.log("Success:", parsed.success);
            console.log("Providers Count:", (parsed.data || []).length);
            (parsed.data || []).forEach(p => {
                console.log(`Provider ID: ${p.id}, Name: ${p.name}, verified: ${p.verified} (type: ${typeof p.verified}), packages count: ${(p.packages || []).length}`);
                if (p.packages) {
                    p.packages.forEach(pkg => {
                        console.log(`  Package ID: ${pkg.PackageID || pkg.id}, Name: "${pkg.PackageName || pkg.name}", isActive: ${pkg.isActive} (type: ${typeof pkg.isActive})`);
                    });
                }
            });
        } catch (e) {
            console.error("JSON Error:", e.message);
        }
    });
}).on('error', e => console.error("HTTP Error:", e.message));
