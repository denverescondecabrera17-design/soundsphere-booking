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

module.exports = {
    sendOTPEmail,
    sendPasswordResetEmail,
    sendProviderAppOTPEmail
};
