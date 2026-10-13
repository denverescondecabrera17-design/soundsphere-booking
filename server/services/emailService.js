/**
 * SoundSphere - Email Service Module
 * Dispatches real verification emails directly to Gmail inboxes via Nodemailer & Google App Passwords
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable Gmail Nodemailer transporter object
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Send OTP Verification Email to Client
 * @param {object} params
 * @param {string} params.toEmail - Recipient email address
 * @param {string} params.clientName - Full name of the client
 * @param {string} params.otpCode - Plain 6-digit numeric OTP
 * @returns {Promise<object>}
 */
const sendOTPEmail = async ({ toEmail, clientName, otpCode }) => {
    console.log(`\n==================================================`);
    console.log(` 📧 SENDING REAL GMAIL OTP DISPATCH`);
    console.log(` FROM: ${process.env.SMTP_USER}`);
    console.log(` TO: ${toEmail} (${clientName})`);
    console.log(` 🔑 6-DIGIT OTP CODE: [ ${otpCode} ]`);
    console.log(`==================================================\n`);

    const mailOptions = {
        from: {
            name: 'SoundSphere Verification',
            address: process.env.SMTP_USER
        },
        to: toEmail.trim().toLowerCase(),
        replyTo: process.env.SMTP_USER,
        subject: 'SoundSphere Email Verification',
        text: `Hello ${clientName},\n\nThank you for registering with SoundSphere.\n\nYour verification code is:\n\n${otpCode}\n\nThis code will expire in 5 minutes.\n\nIf you did not create a SoundSphere account, please ignore this email.\n\nRegards,\nSoundSphere Team`,
        html: `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #0a192f; margin: 0; font-size: 24px; font-weight: 800;">Sound<span style="color: #2563eb;">Sphere</span></h2>
                    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Book Professional Lights & Sounds Services with Ease</p>
                </div>

                <div style="border-top: 3px solid #0a192f; padding-top: 20px;">
                    <p style="font-size: 16px; color: #0a192f;">Hello <strong>${clientName}</strong>,</p>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6;">Thank you for registering with <strong>SoundSphere</strong>. Please use the verification code below to complete your registration:</p>

                    <div style="text-align: center; margin: 28px 0;">
                        <div style="display: inline-block; padding: 16px 32px; background-color: #f0f4f8; border: 2px dashed #1e3e62; border-radius: 8px; font-size: 32px; font-weight: 800; color: #0a192f; letter-spacing: 8px;">
                            ${otpCode}
                        </div>
                    </div>

                    <p style="font-size: 13px; color: #d97706; font-weight: 600; text-align: center;">
                        ⏱ This code will expire in <strong>5 minutes</strong>.
                    </p>

                    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">If you did not create a SoundSphere account, please ignore this email.</p>
                </div>

                <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} SoundSphere Team. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(` REAL GMAIL DISPATCH SUCCESSFUL! Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(' Gmail SMTP Dispatch Error:', error.message);
        throw error;
    }
};

/**
 * Send Real Password Reset Email to User's Gmail / Email Address
 * @param {object} params
 * @param {string} params.toEmail - Recipient email address
 * @param {string} params.clientName - Full name of the user
 * @param {string} params.resetUrl - Full SoundSphere password reset URL with secure token
 * @returns {Promise<object>}
 */
const sendPasswordResetEmail = async ({ toEmail, clientName, resetUrl }) => {
    console.log(`\n==================================================`);
    console.log(` 📧 SENDING REAL GMAIL PASSWORD RESET DISPATCH`);
    console.log(` FROM: ${process.env.SMTP_USER}`);
    console.log(` TO: ${toEmail} (${clientName})`);
    console.log(` 🔗 RESET URL: ${resetUrl}`);
    console.log(`==================================================\n`);

    const mailOptions = {
        from: {
            name: 'SoundSphere Platform',
            address: process.env.SMTP_USER
        },
        to: toEmail.trim().toLowerCase(),
        replyTo: process.env.SMTP_USER,
        subject: 'SoundSphere Password Reset',
        text: `Hello ${clientName},\n\nWe received a request to reset your SoundSphere password.\n\nPlease click the link below to create a new password:\n\n${resetUrl}\n\nThis link will expire in 5 minutes.\n\nIf you did not request this password reset, you can safely ignore this email.\n\nRegards,\nSoundSphere Team`,
        html: `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #0a192f; margin: 0; font-size: 24px; font-weight: 800;">Sound<span style="color: #2563eb;">Sphere</span></h2>
                    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Book Professional Lights & Sounds Services with Ease</p>
                </div>

                <div style="border-top: 3px solid #0a192f; padding-top: 20px;">
                    <p style="font-size: 16px; color: #0a192f;">Hello <strong>${clientName}</strong>,</p>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6;">We received a request to reset your SoundSphere password. Click the button below to create a new password:</p>

                    <div style="text-align: center; margin: 28px 0;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0a192f; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(10, 25, 47, 0.2);">
                            Reset Password
                        </a>
                    </div>

                    <p style="font-size: 13px; color: #d97706; font-weight: 600; text-align: center;">
                        ⏱ This link will expire in <strong>5 minutes</strong>.
                    </p>

                    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">If you did not request a password reset, you can safely ignore this email.</p>
                </div>

                <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} SoundSphere Team. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(` REAL GMAIL PASSWORD RESET DISPATCH SUCCESSFUL! Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(' Gmail SMTP Password Reset Error:', error.message);
        throw error;
    }
};

/**
 * Send OTP Verification Email for Provider Application
 * @param {object} params
 * @param {string} params.toEmail - Business email address
 * @param {string} params.applicantName - Name of business owner / applicant
 * @param {string} params.businessName - Business Name
 * @param {string} params.otpCode - Plain 6-digit numeric OTP
 * @returns {Promise<object>}
 */
const sendProviderAppOTPEmail = async ({ toEmail, applicantName, businessName, otpCode }) => {
    console.log(`\n==================================================`);
    console.log(` 📧 SENDING PROVIDER APPLICATION GMAIL OTP DISPATCH`);
    console.log(` FROM: ${process.env.SMTP_USER}`);
    console.log(` TO: ${toEmail} (${applicantName || 'Applicant'})`);
    console.log(` BUSINESS: ${businessName || 'SoundSphere Provider'}`);
    console.log(` 🔑 6-DIGIT OTP CODE: [ ${otpCode} ]`);
    console.log(`==================================================\n`);

    const mailOptions = {
        from: {
            name: 'SoundSphere Provider Verification',
            address: process.env.SMTP_USER
        },
        to: toEmail.trim().toLowerCase(),
        replyTo: process.env.SMTP_USER,
        subject: 'SoundSphere Provider Application - Email Verification Code',
        text: `Hello ${applicantName || 'Applicant'},\n\nYou are applying to register "${businessName || 'your business'}" as a SoundSphere Service Provider.\n\nYour 6-digit verification code is:\n\n${otpCode}\n\nThis code will expire in 5 minutes.\n\nPlease enter this code in the registration wizard to continue.\n\nRegards,\nSoundSphere Team`,
        html: `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #0a192f; margin: 0; font-size: 24px; font-weight: 800;">Sound<span style="color: #2563eb;">Sphere</span></h2>
                    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Service Provider Verification</p>
                </div>

                <div style="border-top: 3px solid #2563eb; padding-top: 20px;">
                    <p style="font-size: 16px; color: #0a192f;">Hello <strong>${applicantName || 'Applicant'}</strong>,</p>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                        You are submitting an application to register <strong>${businessName || 'your business'}</strong> as a certified Service Provider on SoundSphere.
                    </p>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                        Please use the 6-digit verification code below to verify your business email and continue with your application:
                    </p>

                    <div style="text-align: center; margin: 28px 0;">
                        <div style="display: inline-block; padding: 16px 32px; background-color: #f0f4f8; border: 2px dashed #2563eb; border-radius: 8px; font-size: 32px; font-weight: 800; color: #0a192f; letter-spacing: 8px;">
                            ${otpCode}
                        </div>
                    </div>

                    <p style="font-size: 13px; color: #d97706; font-weight: 600; text-align: center;">
                        ⏱ This verification code will expire in <strong>5 minutes</strong>.
                    </p>

                    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">If you did not apply to become a SoundSphere Service Provider, please ignore this email.</p>
                </div>

                <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} SoundSphere Team. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(` REAL PROVIDER APP GMAIL OTP DISPATCH SUCCESSFUL! Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(' Gmail SMTP Provider App OTP Error:', error.message);
        throw error;
    }
};

/**
 * Send Remaining Balance Due Reminder Email to Client
 * @param {object} params
 * @param {string} params.toEmail - Client email address
 * @param {string} params.clientName - Full name of the client
 * @param {string} params.bookingReference - Booking reference (e.g. SS-2026-00016)
 * @param {string} params.packageName - Package name
 * @param {string} params.dueDate - Event / Service start date (e.g. 2026-10-16)
 * @param {number} params.remainingBalance - Remaining amount due
 * @param {number} params.totalAmount - Total booking cost
 * @param {number} params.amountPaid - Amount already paid
 * @param {string} [params.payUrl] - Direct URL to payment / dashboard
 * @returns {Promise<object>}
 */
const sendBalanceDueReminderEmail = async ({
    toEmail,
    clientName,
    bookingReference,
    packageName,
    dueDate,
    remainingBalance,
    totalAmount,
    amountPaid,
    isOverdue = false,
    daysOverdue = 0
}) => {
    const formattedBalance = parseFloat(remainingBalance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedTotal = parseFloat(totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedPaid = parseFloat(amountPaid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const subjectTitle = isOverdue
        ? `⚠️ Urgent Notice: Payment Overdue for Booking ${bookingReference}`
        : `Payment Reminder: Remaining Balance Due Tomorrow for Booking ${bookingReference}`;

    console.log(`\n==================================================`);
    console.log(` 📧 SENDING ${isOverdue ? 'PAYMENT OVERDUE' : 'BALANCE DUE REMINDER'} GMAIL DISPATCH`);
    console.log(` FROM: ${process.env.SMTP_USER}`);
    console.log(` TO: ${toEmail} (${clientName || 'Client'})`);
    console.log(` REF: ${bookingReference} | DUE DATE: ${dueDate} ${isOverdue ? `(OVERDUE by ${daysOverdue} days)` : '(TOMORROW)'}`);
    console.log(` REMAINING BALANCE: ₱${formattedBalance}`);
    console.log(`==================================================\n`);

    const mailOptions = {
        from: {
            name: isOverdue ? 'SoundSphere Payment Notice' : 'SoundSphere Payment Reminder',
            address: process.env.SMTP_USER
        },
        to: toEmail.trim().toLowerCase(),
        replyTo: process.env.SMTP_USER,
        subject: subjectTitle,
        text: `Hello ${clientName || 'Client'},\n\n${isOverdue ? `This is an urgent notice that your event booking for ${packageName || 'Event Service'} (Reference: ${bookingReference}) was due on ${dueDate} and is now OVERDUE by ${daysOverdue} day(s).` : `This is a friendly reminder that you have an upcoming booking for ${packageName || 'Event Service'} (Reference: ${bookingReference}) scheduled for tomorrow, ${dueDate}.`}\n\nYou have an outstanding remaining balance of ₱${formattedBalance}.\n\nTotal Amount: ₱${formattedTotal}\nDeposit Paid: ₱${formattedPaid}\nRemaining Balance Due: ₱${formattedBalance}\n\nPlease settle your balance immediately to ensure seamless service and avoid disruption.\n\nRegards,\nSoundSphere Team`,
        html: `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #0a192f; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Sound<span style="color: #2563eb;">Sphere</span></h2>
                    <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">${isOverdue ? 'Urgent Payment Notice' : 'Automated Payment Reminder'}</p>
                </div>

                <div style="border-top: 3px solid ${isOverdue ? '#dc2626' : '#e11d48'}; padding-top: 24px;">
                    <div style="display: inline-block; background: ${isOverdue ? '#fee2e2' : '#fff1f2'}; color: ${isOverdue ? '#b91c1c' : '#e11d48'}; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 20px; border: 1.5px solid ${isOverdue ? '#ef4444' : '#fecdd3'}; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${isOverdue ? `⚠️ Payment Overdue (${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} ago)` : '⏰ Due Tomorrow'}
                    </div>
                    <p style="font-size: 16px; color: #0a192f; margin-top: 0;">Hello <strong>${clientName || 'Client'}</strong>,</p>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                        ${isOverdue 
                            ? `This is an urgent notice that your event booking for <strong>${packageName || 'Event Service'}</strong> was due on <strong>${dueDate}</strong> and is currently <strong>OVERDUE</strong>.`
                            : `This is a reminder that your event booking for <strong>${packageName || 'Event Service'}</strong> is scheduled for tomorrow, <strong>${dueDate}</strong>.`
                        }
                    </p>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                        You currently have an outstanding remaining balance of <strong style="color: #dc2626; font-size: 16px;">₱${formattedBalance}</strong> that requires settlement.
                    </p>

                    <!-- Breakdown Card -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0 16px 0;">
                        <h4 style="margin: 0 0 14px 0; color: #0a192f; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                            Booking & Payment Summary
                        </h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Booking Reference:</td>
                                <td style="padding: 6px 0; color: #0a192f; font-weight: 800; text-align: right;">${bookingReference}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Package:</td>
                                <td style="padding: 6px 0; color: #0a192f; font-weight: 700; text-align: right;">${packageName || 'Event Service Package'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Due Date:</td>
                                <td style="padding: 6px 0; color: ${isOverdue ? '#dc2626' : '#e11d48'}; font-weight: 800; text-align: right;">${dueDate} ${isOverdue ? '(Overdue)' : '(Tomorrow)'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Total Amount:</td>
                                <td style="padding: 6px 0; color: #0a192f; font-weight: 700; text-align: right;">₱${formattedTotal}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #059669; font-weight: 600;">Deposit Paid:</td>
                                <td style="padding: 6px 0; color: #059669; font-weight: 700; text-align: right;">-₱${formattedPaid}</td>
                            </tr>
                            <tr style="border-top: 1.5px dashed #cbd5e1;">
                                <td style="padding: 12px 0 4px 0; color: #0a192f; font-weight: 800; font-size: 15px;">${isOverdue ? 'Overdue Balance Due:' : 'Remaining Balance Due:'}</td>
                                <td style="padding: 12px 0 4px 0; color: #dc2626; font-weight: 900; font-size: 18px; text-align: right;">₱${formattedBalance}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 20px; text-align: center;">
                        Please settle your balance to ensure prompt and smooth coordination with your service provider. If you have already settled this balance, please disregard this reminder.
                    </p>
                </div>

                <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} SoundSphere Team. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(` REAL GMAIL BALANCE REMINDER DISPATCH SUCCESSFUL! Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(' Gmail SMTP Balance Reminder Error:', error.message);
        throw error;
    }
};

/**
 * Send Payout Disbursement Confirmation Email to Client's Gmail
 * @param {object} params
 * @param {string} params.toEmail - Client email address
 * @param {string} params.clientName - Full name of the client
 * @param {string} params.providerName - Service provider / business name
 * @param {string} params.bookingReference - Booking reference
 * @param {string} params.packageName - Package name
 * @param {number} params.grossAmount - Gross booking volume
 * @param {number} params.commissionAmount - 5% platform commission
 * @param {number} params.disbursedAmount - Net payout disbursed
 * @param {string} params.payoutMethod - Channel disbursed via (e.g. GCash, Maya)
 * @param {string} params.referenceNumber - Transaction reference number
 * @param {string} params.accountName - Recipient account name
 * @param {string} params.accountNumber - Recipient account number
 * @param {string|number} params.withdrawalId - Withdrawal ID
 * @returns {Promise<object>}
 */
const sendPayoutDisbursedClientEmail = async ({
    toEmail,
    clientName,
    providerName,
    bookingReference,
    packageName,
    grossAmount,
    commissionAmount,
    disbursedAmount,
    payoutMethod,
    referenceNumber,
    accountName,
    accountNumber,
    withdrawalId
}) => {
    const formattedGross = parseFloat(grossAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedComm = parseFloat(commissionAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedNet = parseFloat(disbursedAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    console.log(`\n==================================================`);
    console.log(` 📧 SENDING PAYOUT DISBURSEMENT NOTICE TO CLIENT GMAIL`);
    console.log(` FROM: ${process.env.SMTP_USER}`);
    console.log(` TO: ${toEmail} (${clientName || 'Client'})`);
    console.log(` BOOKING REF: ${bookingReference} | WDR ID: #${withdrawalId}`);
    console.log(` GROSS: ₱${formattedGross} | 5% COMM: -₱${formattedComm} | NET DISBURSED: ₱${formattedNet}`);
    console.log(` METHOD: ${payoutMethod} | REF #: ${referenceNumber}`);
    console.log(`==================================================\n`);

    const mailOptions = {
        from: {
            name: 'SoundSphere Cashier Payments',
            address: process.env.SMTP_USER
        },
        to: toEmail.trim().toLowerCase(),
        replyTo: process.env.SMTP_USER,
        subject: `✅ Payment Disbursed: Booking ${bookingReference || '#' + withdrawalId} - SoundSphere`,
        text: `Hello ${clientName || 'Client'},\n\nWe would like to inform you that the provider payout for your booking (Reference: ${bookingReference || '#' + withdrawalId}) has been successfully disbursed by the SoundSphere Cashier.\n\nBooking Summary:\nService Provider: ${providerName || 'Service Provider'}\nPackage: ${packageName || 'Event Package'}\nGross Booking Volume: ₱${formattedGross}\nSoundSphere Platform Commission (5%): -₱${formattedComm}\nNet Disbursed Payout: ₱${formattedNet}\n\nDisbursement Details:\nPayment Method: ${payoutMethod || 'GCash / Bank Transfer'}\nAccount Name: ${accountName || 'Provider Account'}\nAccount Number: ${accountNumber || 'N/A'}\nTransaction Reference: ${referenceNumber || 'N/A'}\nDisbursed At: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}\n\nThank you for using SoundSphere for your event needs!\n\nRegards,\nSoundSphere Cashier & Finance Team`,
        html: `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #0a192f; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Sound<span style="color: #2563eb;">Sphere</span></h2>
                    <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">Official Cashier Disbursement Receipt & Notice</p>
                </div>

                <div style="border-top: 3px solid #10b981; padding-top: 24px;">
                    <div style="display: inline-block; background: #ecfdf5; color: #047857; font-weight: 800; font-size: 12px; padding: 5px 14px; border-radius: 20px; border: 1.5px solid #a7f3d0; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ✓ Payout Disbursed & Settled
                    </div>
                    
                    <p style="font-size: 16px; color: #0a192f; margin-top: 0;">Hello <strong>${clientName || 'Client'}</strong>,</p>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                        This is an official confirmation from the <strong>SoundSphere Cashier</strong> that the provider earnings for your booking with <strong>${providerName || 'Service Provider'}</strong> have been successfully released and disbursed.
                    </p>

                    <!-- Financial & Commission Breakdown Card -->
                    <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <h4 style="margin: 0 0 14px 0; color: #0a192f; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                            Financial & Commission Breakdown
                        </h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Booking Reference:</td>
                                <td style="padding: 6px 0; color: #0a192f; font-weight: 800; font-family: monospace; text-align: right;">${bookingReference || ('#' + withdrawalId)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Service Package:</td>
                                <td style="padding: 6px 0; color: #0a192f; font-weight: 700; text-align: right;">${packageName || 'Lights & Sounds Package'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Service Provider:</td>
                                <td style="padding: 6px 0; color: #0a192f; font-weight: 700; text-align: right;">${providerName || 'Service Provider'}</td>
                            </tr>
                            <tr style="border-top: 1px solid #e2e8f0;">
                                <td style="padding: 10px 0 6px 0; color: #475569; font-weight: 600;">Gross Booking Amount:</td>
                                <td style="padding: 10px 0 6px 0; color: #0a192f; font-weight: 800; text-align: right;">₱${formattedGross}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #d97706; font-weight: 700;">Platform Commission (5%):</td>
                                <td style="padding: 6px 0; color: #d97706; font-weight: 800; text-align: right;">-₱${formattedComm}</td>
                            </tr>
                            <tr style="border-top: 1.5px dashed #cbd5e1;">
                                <td style="padding: 12px 0 4px 0; color: #0a192f; font-weight: 800; font-size: 15px;">Net Disbursed to Provider:</td>
                                <td style="padding: 12px 0 4px 0; color: #059669; font-weight: 900; font-size: 18px; text-align: right;">₱${formattedNet}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Payout Destination Details -->
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 13px; font-weight: 800; text-transform: uppercase;">
                            Disbursement Receipt Details
                        </h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Method / Channel:</td>
                                <td style="padding: 4px 0; color: #0a192f; font-weight: 700; text-align: right;">${payoutMethod || 'GCash / Bank Transfer'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Recipient Account:</td>
                                <td style="padding: 4px 0; color: #0a192f; font-weight: 700; text-align: right;">${accountName || '-'} (${accountNumber || '-'})</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Transaction Reference:</td>
                                <td style="padding: 4px 0; color: #2563eb; font-weight: 800; font-family: monospace; text-align: right;">${referenceNumber || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Status:</td>
                                <td style="padding: 4px 0; color: #059669; font-weight: 800; text-align: right;">COMPLETED</td>
                            </tr>
                        </table>
                    </div>

                    <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center; margin-top: 16px;">
                        Thank you for coordinating through <strong>SoundSphere</strong>. Your reservation and provider compensation are fully completed.
                    </p>
                </div>

                <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} SoundSphere Platform. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(` REAL GMAIL PAYOUT DISBURSEMENT NOTICE SUCCESSFUL! Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(' Gmail SMTP Payout Disbursement Notice Error:', error.message);
        throw error;
    }
};

/**
 * Send Real Refund Processed / Disbursed Confirmation Email to Client
 * @param {object} params
 */
const sendRefundProcessedClientEmail = async ({
    toEmail,
    clientName,
    refundRequestId,
    bookingReference,
    packageName,
    providerName,
    amount,
    payoutMethod,
    accountName,
    accountNumber,
    referenceNumber,
    notes
}) => {
    const formattedAmount = parseFloat(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    console.log(`\n==================================================`);
    console.log(` 📧 SENDING CLIENT REFUND CONFIRMATION EMAIL`);
    console.log(` FROM: ${process.env.SMTP_USER}`);
    console.log(` TO: ${toEmail} (${clientName || 'Client'})`);
    console.log(` REFUND ID: #${refundRequestId} | BOOKING REF: ${bookingReference || 'N/A'}`);
    console.log(` AMOUNT REFUNDED: ₱${formattedAmount} | METHOD: ${payoutMethod}`);
    console.log(` ACCOUNT: ${accountName} (${accountNumber})`);
    console.log(`==================================================\n`);

    const mailOptions = {
        from: {
            name: 'SoundSphere Cashier Refunds',
            address: process.env.SMTP_USER
        },
        to: toEmail.trim().toLowerCase(),
        replyTo: process.env.SMTP_USER,
        subject: `💸 Refund Completed: Booking ${bookingReference || '#' + refundRequestId} - SoundSphere`,
        text: `Hello ${clientName || 'Client'},\n\nYour refund request (Reference: ${bookingReference || '#' + refundRequestId}) has been officially processed and marked as Refunded by the SoundSphere Cashier.\n\nThe refund of ₱${formattedAmount} has been transferred to your designated account outside the system:\nPayment Channel: ${payoutMethod || 'GCash'}\nAccount Name: ${accountName || '-'}\nAccount Number / Mobile: ${accountNumber || '-'}\nTransaction Reference: ${referenceNumber || 'N/A'}\n\nYour booking and payment status is now updated to Refunded. Thank you for using SoundSphere!\n\nRegards,\nSoundSphere Cashier & Finance Team`,
        html: `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #0a192f; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Sound<span style="color: #2563eb;">Sphere</span></h2>
                    <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">Official Cashier Refund Confirmation</p>
                </div>

                <div style="border-top: 3px solid #10b981; padding-top: 24px;">
                    <div style="display: inline-block; background: #ecfdf5; color: #047857; font-weight: 800; font-size: 12px; padding: 5px 14px; border-radius: 20px; border: 1.5px solid #a7f3d0; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ✓ Refund Sent & Completed
                    </div>
                    
                    <p style="font-size: 16px; color: #0a192f; margin-top: 0;">Hello <strong>${clientName || 'Client'}</strong>,</p>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                        This is an official confirmation from the <strong>SoundSphere Cashier</strong> that your refund has been processed outside the platform and successfully marked as <strong>Refunded</strong>.
                    </p>

                    <!-- Refund Card -->
                    <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <h4 style="margin: 0 0 14px 0; color: #0a192f; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                            Refund Summary
                        </h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Refund Request ID:</td>
                                <td style="padding: 6px 0; color: #0a192f; font-weight: 800; font-family: monospace; text-align: right;">#REF-${refundRequestId}</td>
                            </tr>
                            ${bookingReference ? `
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Booking Reference:</td>
                                <td style="padding: 6px 0; color: #0a192f; font-weight: 800; font-family: monospace; text-align: right;">${bookingReference}</td>
                            </tr>
                            ` : ''}
                            ${packageName ? `
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Service / Package:</td>
                                <td style="padding: 6px 0; color: #0a192f; font-weight: 700; text-align: right;">${packageName}</td>
                            </tr>
                            ` : ''}
                            ${providerName ? `
                            <tr>
                                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Provider:</td>
                                <td style="padding: 6px 0; color: #0a192f; font-weight: 700; text-align: right;">${providerName}</td>
                            </tr>
                            ` : ''}
                            <tr style="border-top: 1.5px dashed #cbd5e1;">
                                <td style="padding: 12px 0 4px 0; color: #0a192f; font-weight: 800; font-size: 15px;">Total Amount Refunded:</td>
                                <td style="padding: 12px 0 4px 0; color: #059669; font-weight: 900; font-size: 20px; text-align: right;">₱${formattedAmount}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Destination Details -->
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 13px; font-weight: 800; text-transform: uppercase;">
                            Payout Account Destination
                        </h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Payout Method:</td>
                                <td style="padding: 4px 0; color: #0a192f; font-weight: 700; text-align: right;">${payoutMethod || 'GCash / Bank Transfer'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Account Holder:</td>
                                <td style="padding: 4px 0; color: #0a192f; font-weight: 700; text-align: right;">${accountName || '-'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Account / Mobile Number:</td>
                                <td style="padding: 4px 0; color: #2563eb; font-weight: 800; font-family: monospace; text-align: right;">${accountNumber || '-'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;">Status:</td>
                                <td style="padding: 4px 0; color: #059669; font-weight: 800; text-align: right;">REFUNDED</td>
                            </tr>
                        </table>
                    </div>

                    <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center; margin-top: 16px;">
                        The funds have been transferred directly to your destination account outside the system. Your booking records and client portal have been updated to reflect the completed refund.
                    </p>
                </div>

                <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} SoundSphere Platform. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(` REAL GMAIL CLIENT REFUND NOTICE SUCCESSFUL! Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(' Gmail SMTP Client Refund Notice Error:', error.message);
        throw error;
    }
};

/**
 * Send Official Booking Confirmation Email Receipt to Client
 */
const sendBookingConfirmationEmail = async ({
    toEmail,
    clientName = 'Valued Client',
    bookingReference,
    packageName,
    eventDate,
    startTime,
    endTime,
    venueName,
    eventPlace,
    totalAmount,
    amountPaid,
    remainingBalance,
    paymentType
}) => {
    if (!toEmail) return null;
    const formatPhp = (val) => '₱' + (parseFloat(val) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const mailOptions = {
        from: {
            name: 'SoundSphere Reservations',
            address: process.env.SMTP_USER
        },
        to: toEmail.trim().toLowerCase(),
        replyTo: process.env.SMTP_USER,
        subject: `🎉 Booking Confirmed! [${bookingReference}] - ${packageName}`,
        html: `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #0a192f; margin: 0; font-size: 24px; font-weight: 800;">Sound<span style="color: #2563eb;">Sphere</span></h2>
                    <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Lights & Sounds Event Booking System</p>
                </div>

                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 24px;">
                    <span style="color: #059669; font-size: 22px; font-weight: 900; letter-spacing: -0.01em;">BOOKING CONFIRMED</span>
                    <p style="color: #065f46; font-size: 14px; margin: 6px 0 0 0;">Your reservation has been confirmed and registered in our database.</p>
                </div>

                <p style="font-size: 15px; color: #0f172a;">Hello <strong>${clientName}</strong>,</p>
                <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                    Thank you for choosing SoundSphere! Here are the details of your confirmed event booking:
                </p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Booking Reference:</td>
                            <td style="padding: 6px 0; color: #2563eb; font-weight: 800; text-align: right;">${bookingReference}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Package:</td>
                            <td style="padding: 6px 0; color: #0a192f; font-weight: 700; text-align: right;">${packageName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Event Date:</td>
                            <td style="padding: 6px 0; color: #0a192f; font-weight: 700; text-align: right;">${eventDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Schedule:</td>
                            <td style="padding: 6px 0; color: #0a192f; font-weight: 700; text-align: right;">${startTime || '08:00'} - ${endTime || '22:00'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;">Venue & Location:</td>
                            <td style="padding: 6px 0; color: #0a192f; font-weight: 700; text-align: right;">${venueName || 'Venue'}, ${eventPlace || 'Batangas'}</td>
                        </tr>
                        <tr style="border-top: 1px dashed #cbd5e1;">
                            <td style="padding: 10px 0 6px 0; color: #0a192f; font-weight: 700;">Total Amount:</td>
                            <td style="padding: 10px 0 6px 0; color: #0a192f; font-weight: 800; font-size: 15px; text-align: right;">${formatPhp(totalAmount)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #059669; font-weight: 700;">Amount Paid:</td>
                            <td style="padding: 4px 0; color: #059669; font-weight: 800; text-align: right;">${formatPhp(amountPaid)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #64748b;">Remaining Balance:</td>
                            <td style="padding: 4px 0; color: ${remainingBalance > 0 ? '#dc2626' : '#64748b'}; font-weight: 800; text-align: right;">${formatPhp(remainingBalance)}</td>
                        </tr>
                    </table>
                </div>

                <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center; margin-top: 18px;">
                    You can view, manage, and track this booking at any time under <strong>Me / Profile &gt; My Bookings</strong>.
                </p>

                <div style="margin-top: 26px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} SoundSphere Platform. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(` REAL GMAIL BOOKING CONFIRMATION DISPATCH SUCCESSFUL! Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(' Gmail SMTP Booking Confirmation Error:', error.message);
        return null;
    }
};

/**
 * Send Business Permit Expiration Notice Email to Service Provider
 */
const sendPermitRenewalNoticeEmail = async ({
    toEmail,
    providerName,
    businessName,
    expiryDate,
    isExpired,
    daysRemaining
}) => {
    if (!toEmail) return null;

    const formattedDate = expiryDate ? new Date(expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Expired';
    const statusText = isExpired ? 'EXPIRED' : `EXPIRING IN ${daysRemaining} DAYS`;
    const statusColor = isExpired ? '#dc2626' : '#d97706';
    const statusBg = isExpired ? '#fef2f2' : '#fffbeb';
    const borderCol = isExpired ? '#fecaca' : '#fde68a';

    const subject = isExpired
        ? `[Action Required] SoundSphere Business Permit Expired - ${businessName || providerName}`
        : `[Notice] SoundSphere Business Permit Expiring Soon - ${businessName || providerName}`;

    const mailOptions = {
        from: {
            name: 'SoundSphere Compliance Team',
            address: process.env.SMTP_USER
        },
        to: toEmail.trim().toLowerCase(),
        subject,
        html: `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #0a192f; margin: 0; font-size: 24px; font-weight: 800;">Sound<span style="color: #2563eb;">Sphere</span></h2>
                    <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Provider Compliance & Regulatory Notice</p>
                </div>

                <div style="background: ${statusBg}; border: 1px solid ${borderCol}; border-radius: 10px; padding: 18px 20px; text-align: center; margin-bottom: 24px;">
                    <span style="display: inline-block; font-size: 12px; font-weight: 800; color: ${statusColor}; letter-spacing: 1px; text-transform: uppercase;">
                        Compliance Status
                    </span>
                    <h3 style="margin: 6px 0 0 0; color: ${statusColor}; font-size: 18px; font-weight: 800;">
                        ${isExpired ? 'BUSINESS PERMIT EXPIRED' : `BUSINESS PERMIT EXPIRING SOON (${daysRemaining} DAYS)`}
                    </h3>
                </div>

                <div style="color: #334155; font-size: 14px; line-height: 1.6;">
                    <p>Dear <strong>${providerName || businessName}</strong>,</p>
                    <p>
                        This is an official compliance notification regarding your registered business permit for <strong>${businessName}</strong> on SoundSphere.
                    </p>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
                        <table style="width: 100%; font-size: 13px;">
                            <tr>
                                <td style="padding: 4px 0; color: #64748b; width: 45%;"><strong>Business Name:</strong></td>
                                <td style="padding: 4px 0; color: #0a192f; font-weight: 700;">${businessName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;"><strong>Permit Expiration Date:</strong></td>
                                <td style="padding: 4px 0; color: ${statusColor}; font-weight: 700;">${formattedDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; color: #64748b;"><strong>Booking Capability:</strong></td>
                                <td style="padding: 4px 0; color: ${isExpired ? '#dc2626' : '#059669'}; font-weight: 700;">
                                    ${isExpired ? 'Disabled for New Bookings' : 'Active (Pending Expiry)'}
                                </td>
                            </tr>
                        </table>
                    </div>

                    ${isExpired ? `
                        <div style="background: #fff1f2; border-left: 4px solid #e11d48; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                            <strong style="color: #9f1239; font-size: 13px; display: block; margin-bottom: 4px;">⚠️ Service Disruption Notice:</strong>
                            <span style="color: #881337; font-size: 13px;">
                                Because your business permit has expired, your profile cannot receive or accept new client bookings. Your existing confirmed bookings remain active and must still be fulfilled.
                            </span>
                        </div>
                    ` : `
                        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                            <strong style="color: #92400e; font-size: 13px; display: block; margin-bottom: 4px;">⚠️ Action Required:</strong>
                            <span style="color: #78350f; font-size: 13px;">
                                Please submit your renewed business permit before ${formattedDate} to avoid interruption of your booking reception.
                            </span>
                        </div>
                    `}

                    <h4 style="margin: 20px 0 8px 0; color: #0a192f; font-size: 14px;">Next Steps:</h4>
                    <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
                        <li>Obtain your renewed Mayor's / Business Permit from your local municipal hall (LGU).</li>
                        <li>Log in to your <strong>SoundSphere Provider Dashboard</strong>.</li>
                        <li>Submit a clear photo or PDF copy of your renewed permit along with the new expiration date.</li>
                        <li>Our administrative compliance team will verify and re-enable your full booking capabilities.</li>
                    </ol>
                </div>

                <div style="margin-top: 30px; padding-top: 18px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} SoundSphere Platform Regulatory Compliance. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(` REAL GMAIL PERMIT NOTICE DISPATCH SUCCESSFUL! Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(' Gmail SMTP Permit Notice Dispatch Error:', error.message);
        return null;
    }
};

module.exports = {
    sendOTPEmail,
    sendPasswordResetEmail,
    sendProviderAppOTPEmail,
    sendBalanceDueReminderEmail,
    sendPayoutDisbursedClientEmail,
    sendRefundProcessedClientEmail,
    sendBookingConfirmationEmail,
    sendPermitRenewalNoticeEmail
};


