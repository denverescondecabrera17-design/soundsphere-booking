const http = require('http');

async function makeRequest(path, method = 'GET', data = null, token = null) {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'localhost',
            port: 5000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function testCashierSubscriptions() {
    console.log('--- Testing Cashier Subscriptions Flow ---');
    
    // 1. Login Cashier
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
        email: 'cashier@soundsphere.com',
        password: 'Cashier@123'
    });
    console.log('Login Status:', loginRes.status);
    const token = loginRes.data.token;
    if (!token) {
        console.error('No token received:', loginRes.data);
        return;
    }
    console.log('Cashier Login OK. Role:', loginRes.data.user?.roleName);

    // 2. Get Subscriptions Overview
    const overviewRes = await makeRequest('/api/cashier/subscriptions/overview', 'GET', null, token);
    console.log('Subscriptions Overview Status:', overviewRes.status);
    console.log('Overview KPIs:', overviewRes.data.kpis);
    console.log('Existing Payments Count:', overviewRes.data.payments?.length);
    console.log('Available Providers Count:', overviewRes.data.providers?.length);

    if (overviewRes.data.providers?.length > 0) {
        const prov = overviewRes.data.providers[0];
        console.log(`Recording payment for Provider: ${prov.BusinessName} (ID: ${prov.ProviderID})`);

        // 3. Record a Subscription Payment
        const recordRes = await makeRequest('/api/cashier/subscriptions/record-payment', 'POST', {
            providerId: prov.ProviderID,
            planType: 'monthly',
            amount: 499.00,
            paymentMethod: 'Over-the-Counter Cash',
            referenceNumber: 'CASH-TEST-' + Date.now().toString().slice(-4),
            notes: 'Test In-Person Cashier collection'
        }, token);

        console.log('Record Payment Status:', recordRes.status, recordRes.data);

        // 4. Verify Income Report includes the new subscription
        const reportRes = await makeRequest('/api/cashier/reports/income?period=daily', 'GET', null, token);
        console.log('Daily Income Report Status:', reportRes.status);
        console.log('Daily Report Summary:', reportRes.data.report?.summary);
    }
}

testCashierSubscriptions().catch(console.error);
