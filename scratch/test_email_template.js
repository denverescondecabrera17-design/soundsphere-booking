const { sendBalanceDueReminderEmail } = require('../server/services/emailService');

async function testEmail() {
    console.log('Sending test balance due reminder email without pay button...');
    const info = await sendBalanceDueReminderEmail({
        toEmail: 'denverescondecabrera17@gmail.com',
        clientName: 'Denver Cabrera',
        bookingReference: 'SS-2026-00016',
        packageName: 'bundle a for wedding',
        dueDate: '2026-10-11',
        remainingBalance: 380,
        totalAmount: 760,
        amountPaid: 380
    });
    console.log('Success! Message ID:', info.messageId);
    process.exit(0);
}

testEmail().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
