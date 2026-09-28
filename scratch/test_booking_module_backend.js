const fetch = require('node-fetch');

async function testBookingModuleBackend() {
    console.log('--- TESTING BOOKING MODULE BACKEND ---');

    try {
        // 1. Test Package Fetch API
        const pkgRes = await fetch('http://localhost:5000/api/packages/1');
        console.log('GET /api/packages/1 Status:', pkgRes.status);
        if (pkgRes.ok) {
            const data = await pkgRes.json();
            console.log('Package Data:', data.success ? data.package.PackageName : data.message);
        }

        // 2. Test Availability Check API
        const availRes = await fetch('http://localhost:5000/api/bookings/check-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                providerId: 13,
                eventDate: '2026-09-10',
                startTime: '18:00',
                endTime: '22:00'
            })
        });
        console.log('POST /api/bookings/check-availability Status:', availRes.status);
        if (availRes.ok) {
            const data = await availRes.json();
            console.log('Availability Result:', data.isAvailable ? 'Available' : 'Conflict Detected');
        }

        // 3. Test Maps Config API
        const mapsRes = await fetch('http://localhost:5000/api/config/maps-key');
        console.log('GET /api/config/maps-key Status:', mapsRes.status);

        console.log('--- ALL BACKEND CHECKS COMPLETED ---');
    } catch (err) {
        console.warn('Backend test notice (server may be restarted):', err.message);
    }
}

testBookingModuleBackend();
