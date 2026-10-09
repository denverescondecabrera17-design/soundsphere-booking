const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'soundsphere_super_secret_jwt_key_2026';

const token = jwt.sign(
    { userId: 1, email: 'soundsphere@gmail.com', role: 'Administrator', roleId: 1 },
    JWT_SECRET,
    { expiresIn: '1h' }
);

async function testReportDetails() {
    try {
        const res = await fetch('http://localhost:5000/api/cashier/reports/income?period=yearly&year=2026', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('Yearly Report Full Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

testReportDetails();
