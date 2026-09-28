const fetch = require('node-fetch');

async function testReportEndpoint() {
    try {
        const res = await fetch('http://localhost:5000/api/reports/provider', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 1,
                providerId: 13,
                reason: 'Unprofessional Behavior / Harassment',
                description: 'Test report to verify reason and picture proof handling endpoint works smoothly.',
                proofImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
            })
        });

        const data = await res.json();
        console.log('Report API Test Status:', res.status);
        console.log('Report API Test Data:', data);
    } catch (err) {
        console.error('Test error:', err.message);
    }
}

testReportEndpoint();
