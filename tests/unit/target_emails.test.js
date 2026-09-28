const path = require('path');
const { sendOTPEmail, sendPasswordResetEmail } = require(path.join(__dirname, '../server/services/emailService'));

async function testExternalEmails() {
    const targets = [
        'denverescondecabrera17@gmail.com',
        'denvercabrera.apo@gmail.com',
        'printcessbalayan@gmail.com'
    ];

    for (const target of targets) {
        console.log(`\n==================================================`);
        console.log(` TESTING SEND TO REAL USER EMAIL: ${target}`);
        console.log(`==================================================`);
        try {
            const res = await sendPasswordResetEmail({
                toEmail: target,
                clientName: 'Denver Cabrera',
                resetUrl: 'http://localhost:5000/reset-password.html?token=test_token_12345'
            });
            console.log(`Result for ${target}:`, res.response);
        } catch (err) {
            console.error(`FAILED to send to ${target}:`, err.message);
        }
    }
}

testExternalEmails();
