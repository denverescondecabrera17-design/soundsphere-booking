const fetch = require('node-fetch');

async function testProviderLogin() {
    try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cabrera@gmail.com',
                password: 'password123'
            })
        });
        const data = await res.json();
        console.log('Login Response for cabrera@gmail.com:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testProviderLogin();
