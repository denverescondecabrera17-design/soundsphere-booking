(async () => {
    const res = await fetch('http://localhost:5000/api/providers');
    const data = await res.json();
    console.log('Total Providers:', data.count);
    let totalPkgs = 0;
    data.data.forEach(p => {
        console.log('- Provider:', p.name, '(' + p.packages.length + ' packages)');
        p.packages.forEach(pkg => console.log('   *', pkg.name, '- ?' + pkg.price.toLocaleString()));
        totalPkgs += p.packages.length;
    });
    console.log('Total Active Packages:', totalPkgs);
    process.exit(0);
})();
