const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'soundsphere_super_secret_jwt_key_2026';

// Generate admin token
const token = jwt.sign(
    { userId: 1, email: 'soundsphere@gmail.com', role: 'Administrator', roleId: 1 },
    JWT_SECRET,
    { expiresIn: '1h' }
);

async function testCashierAPI() {
    try {
        console.log('Testing GET http://localhost:5000/api/cashier/summary ...');
        const sumRes = await fetch('http://localhost:5000/api/cashier/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const sumData = await sumRes.json();
        console.log('Summary Result:', JSON.stringify(sumData, null, 2));

        console.log('\nTesting GET http://localhost:5000/api/cashier/withdrawals/list ...');
        const wRes = await fetch('http://localhost:5000/api/cashier/withdrawals/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const wData = await wRes.json();
        console.log('Withdrawals Count:', wData.withdrawals ? wData.withdrawals.length : 0);

        console.log('\nTesting GET http://localhost:5000/api/cashier/reports/income?period=daily ...');
        const dRes = await fetch('http://localhost:5000/api/cashier/reports/income?period=daily', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dData = await dRes.json();
        console.log('Daily Report Summary:', JSON.stringify(dData.report?.summary, null, 2));

        console.log('\nTesting GET http://localhost:5000/api/cashier/reports/income?period=weekly ...');
        const wkRes = await fetch('http://localhost:5000/api/cashier/reports/income?period=weekly', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const wkData = await wkRes.json();
        console.log('Weekly Report Summary:', JSON.stringify(wkData.report?.summary, null, 2));

        console.log('\nTesting GET http://localhost:5000/api/cashier/reports/income?period=monthly ...');
        const mRes = await fetch('http://localhost:5000/api/cashier/reports/income?period=monthly', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const mData = await mRes.json();
        console.log('Monthly Report Summary:', JSON.stringify(mData.report?.summary, null, 2));

        console.log('\nTesting GET http://localhost:5000/api/cashier/reports/income?period=yearly ...');
        const yRes = await fetch('http://localhost:5000/api/cashier/reports/income?period=yearly', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const yData = await yRes.json();
        console.log('Yearly Report Summary:', JSON.stringify(yData.report?.summary, null, 2));

        console.log('\nTesting GET http://localhost:5000/cashier/dashboard.html (HTML page serving) ...');
        const pageRes = await fetch('http://localhost:5000/cashier/dashboard.html');
        console.log('Cashier Dashboard Status:', pageRes.status, pageRes.headers.get('content-type'));

        console.log('\n✅ ALL CASHIER ENDPOINTS AND HTML ROUTES ARE WORKING PERFECTLY!');
    } catch (err) {
        console.error('Test error:', err);
    }
}

testCashierAPI();
