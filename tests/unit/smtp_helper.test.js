const path = require('path');
const { sendOTPEmail, sendPasswordResetEmail, sendProviderAppOTPEmail } = require(path.join(__dirname, '../../server/services/emailService'));

async function testEmail() {
    try {
        console.log('Testing sendOTPEmail...');
        const res1 = await sendOTPEmail({
            toEmail: 'dendenescondecabrera17@gmail.com',
            clientName: 'Denver Cabrera',
            otpCode: '123456'
        });
        console.log('OTP Result:', res1);

        console.log('Testing sendPasswordResetEmail...');
        const res2 = await sendPasswordResetEmail({
            toEmail: 'dendenescondecabrera17@gmail.com',
            clientName: 'Denver Cabrera',
            resetUrl: 'http://localhost:5000/reset-password.html?token=testtoken'
        });
        console.log('Reset Result:', res2);
    } catch (err) {
        console.error('Test Email Failed with Error:', err);
    }
}

testEmail();
