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

async function testPayMongoVerify() {
    console.log('--- Testing Cashier PayMongo Withdrawal Verification ---');

    // 1. Cashier Login
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
        email: 'cashier@soundsphere.com',
        password: 'Cashier@123'
    });
    console.log('Cashier Login Status:', loginRes.status);
    const token = loginRes.data.token;

    // 2. Fetch Withdrawals with PayMongo details
    const listRes = await makeRequest('/api/cashier/withdrawals/list', 'GET', null, token);
    console.log('Withdrawals List Status:', listRes.status);
    const withdrawals = listRes.data.withdrawals || [];
    console.log(`Found ${withdrawals.length} withdrawals.`);

    if (withdrawals.length > 0) {
        const sample = withdrawals[0];
        console.log('Sample Withdrawal:', {
            id: sample.WithdrawalID,
            amount: sample.Amount,
            provider: sample.ProviderName,
            isPayMongoVerified: sample.isPayMongoVerified,
            totalPayMongoPaid: sample.totalPayMongoPaid,
            primaryPayMongoRef: sample.primaryPayMongoRef,
            paymongoPaymentsCount: sample.paymongoPayments?.length
        });

        // 3. Verify Specific Withdrawal
        const verifyRes = await makeRequest(`/api/cashier/withdrawals/${sample.WithdrawalID}/paymongo-verify`, 'GET', null, token);
        console.log('PayMongo Verify Status:', verifyRes.status);
        console.log('Verification Details:', verifyRes.data.verification);
    }
}

testPayMongoVerify().catch(console.error);
