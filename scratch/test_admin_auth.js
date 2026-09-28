const fetch = require('node-fetch');

async function testAdminAuth() {
    try {
        console.log('--- Testing Admin Authentication & All Endpoints ---');

        // 1. Admin Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'soundsphere@gmail.com',
                password: 'soundsphere@041704'
            })
        });
        const loginData = await loginRes.json();
        console.log('Admin Login Response:', loginData.success ? 'SUCCESS' : 'FAILED', loginData.message || '');

        if (loginData.success && loginData.token) {
            const token = loginData.token;
            console.log('Admin User Role:', loginData.user ? loginData.user.role : 'N/A');

            const headers = { 'Authorization': `Bearer ${token}` };

            const testEndpoint = async (name, url) => {
                const res = await fetch(url, { headers });
                console.log(`${name} Status:`, res.status);
                if (!res.ok) {
                    const txt = await res.text();
                    console.log(`  -> Error detail: ${txt}`);
                }
            };

            await testEndpoint('/api/admin/profile', 'http://localhost:5000/api/admin/profile');
            await testEndpoint('/api/admin/stats', 'http://localhost:5000/api/admin/stats');
            await testEndpoint('/api/admin/applications', 'http://localhost:5000/api/admin/applications');
            await testEndpoint('/api/admin/escrow/list', 'http://localhost:5000/api/admin/escrow/list');
            await testEndpoint('/api/admin/withdrawals/list', 'http://localhost:5000/api/admin/withdrawals/list');
            await testEndpoint('/api/admin/reports', 'http://localhost:5000/api/admin/reports');
            await testEndpoint('/api/admin/audit-logs', 'http://localhost:5000/api/admin/audit-logs');
            await testEndpoint('/api/subscriptions/admin/overview', 'http://localhost:5000/api/subscriptions/admin/overview');
        }

    } catch (err) {
        console.error('Test error:', err);
    }
}

testAdminAuth();
