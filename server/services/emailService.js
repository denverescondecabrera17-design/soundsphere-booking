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

module.exports = {
    sendOTPEmail,
    sendPasswordResetEmail,
    sendProviderAppOTPEmail,
    sendBalanceDueReminderEmail
};

