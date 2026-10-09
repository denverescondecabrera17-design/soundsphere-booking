const http = require('http');

const loginData = JSON.stringify({
    email: 'cashier@soundsphere.com',
    password: 'Cashier@123'
});

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const auth = JSON.parse(body);
        console.log('Cashier Login:', auth.success ? 'OK (Role: ' + auth.user.role + ')' : auth.message);
        
        http.get({
            hostname: 'localhost',
            port: 5000,
            path: '/api/cashier/withdrawals/list',
            headers: {
                'Authorization': 'Bearer ' + auth.token
            }
        }, (res2) => {
            let body2 = '';
            res2.on('data', chunk => body2 += chunk);
            res2.on('end', () => {
                const list = JSON.parse(body2);
                console.log('Withdrawals retrieved count:', list.withdrawals ? list.withdrawals.length : 0);
                if (list.withdrawals) {
                    list.withdrawals.forEach(w => {
                        console.log(`- #WDR-${w.WithdrawalID} | ${w.ProviderName} | Amount: ₱${w.Amount} | PayMongo Verified: ${w.isPayMongoVerified} | Session: ${w.primaryPayMongoRef}`);
                    });
                }
                
                if (list.withdrawals && list.withdrawals.length > 0) {
                    const wid = list.withdrawals[0].WithdrawalID;
                    http.get({
                        hostname: 'localhost',
                        port: 5000,
                        path: `/api/cashier/withdrawals/${wid}/paymongo-verify`,
                        headers: {
                            'Authorization': 'Bearer ' + auth.token
                        }
                    }, (res3) => {
                        let body3 = '';
                        res3.on('data', chunk => body3 += chunk);
                        res3.on('end', () => {
                            const v = JSON.parse(body3);
                            console.log('\n--- PayMongo Verification Modal API Check ---');
                            console.log('Success:', v.success);
                            console.log('Provider:', v.withdrawal ? v.withdrawal.ProviderName : 'N/A');
                            console.log('Payout Requested:', v.verification ? v.verification.requestedPayout : 0);
                            console.log('Total Client Paid:', v.verification ? v.verification.totalClientPaid : 0);
                            console.log('Live Gateway Status:', v.verification && v.verification.liveGatewayCheck ? v.verification.liveGatewayCheck.status : 'N/A');
                            console.log('Itemized Payments Count:', v.verification && v.verification.payments ? v.verification.payments.length : 0);
                            console.log('Payment Methods:', v.verification ? v.verification.paymentMethods : []);
                            console.log('\nVerification Test Completed Successfully!');
                        });
                    });
                }
            });
        });
    });
});

req.write(loginData);
req.end();
