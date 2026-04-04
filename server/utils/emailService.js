const nodemailer = require('nodemailer');

// Create reusable transporter
// Uses environment variables for SMTP configuration
// Falls back to Ethereal test account if not configured
let transporter;

const initializeTransporter = async () => {
    // If SMTP credentials are provided, use them
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log('✅ Email transporter initialized with SMTP credentials');
    } else {
        // Create a test account using Ethereal for development
        console.log('⚠️ No SMTP credentials found. Email notifications are disabled.');
        console.log('  Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable emails.');
        transporter = null;
    }
};

// Initialize on module load
initializeTransporter();

/**
 * Send an email notification
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body content
 * @param {string} [options.text] - Plain text fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
    if (!transporter) {
        console.log(`📧 Email would be sent to: ${to} | Subject: ${subject}`);
        return { success: false, message: 'Email transporter not configured' };
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Skill Hub LMS" <noreply@skillhub.com>',
            to,
            subject,
            html,
            text: text || subject,
        });

        console.log(`📧 Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Send enrollment confirmation email
 */
const sendEnrollmentEmail = async (userEmail, userName, courseTitle) => {
    return sendEmail({
        to: userEmail,
        subject: `🎉 You're enrolled in "${courseTitle}"!`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎓 Welcome Aboard!</h1>
                </div>
                <div style="padding: 30px; background-color: #f8fafc; border-radius: 0 0 12px 12px;">
                    <p style="font-size: 16px; color: #334155;">Hi <strong>${userName}</strong>,</p>
                    <p style="font-size: 16px; color: #334155;">
                        Congratulations! You've successfully enrolled in <strong>"${courseTitle}"</strong>.
                    </p>
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                        <p style="font-size: 14px; color: #64748b; margin: 0;">Start learning right away from your dashboard!</p>
                    </div>
                    <p style="font-size: 14px; color: #64748b;">Happy Learning! 📚</p>
                    <p style="font-size: 14px; color: #94a3b8;">— The Skill Hub Team</p>
                </div>
            </div>
        `,
    });
};

/**
 * Send payment success email
 */
const sendPaymentSuccessEmail = async (userEmail, userName, courseTitle, amount) => {
    return sendEmail({
        to: userEmail,
        subject: `✅ Payment Confirmed for "${courseTitle}"`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Payment Successful</h1>
                </div>
                <div style="padding: 30px; background-color: #f8fafc; border-radius: 0 0 12px 12px;">
                    <p style="font-size: 16px; color: #334155;">Hi <strong>${userName}</strong>,</p>
                    <p style="font-size: 16px; color: #334155;">
                        Your payment of <strong>$${amount}</strong> for <strong>"${courseTitle}"</strong> has been confirmed.
                    </p>
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Course</td>
                                <td style="padding: 8px 0; color: #334155; font-size: 14px; text-align: right; font-weight: bold;">${courseTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount</td>
                                <td style="padding: 8px 0; color: #334155; font-size: 14px; text-align: right; font-weight: bold;">$${amount}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
                                <td style="padding: 8px 0; color: #334155; font-size: 14px; text-align: right;">${new Date().toLocaleDateString()}</td>
                            </tr>
                        </table>
                    </div>
                    <p style="font-size: 14px; color: #94a3b8;">— The Skill Hub Team</p>
                </div>
            </div>
        `,
    });
};

/**
 * Send certificate earned email
 */
const sendCertificateEmail = async (userEmail, userName, courseTitle) => {
    return sendEmail({
        to: userEmail,
        subject: `🏆 Certificate Earned for "${courseTitle}"!`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏆 Congratulations!</h1>
                </div>
                <div style="padding: 30px; background-color: #f8fafc; border-radius: 0 0 12px 12px;">
                    <p style="font-size: 16px; color: #334155;">Hi <strong>${userName}</strong>,</p>
                    <p style="font-size: 16px; color: #334155;">
                        Amazing work! You've completed <strong>"${courseTitle}"</strong> and earned your certificate of completion!
                    </p>
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                        <p style="font-size: 18px; color: #d97706; font-weight: bold; margin: 0;">🎓 Certificate of Completion</p>
                        <p style="font-size: 14px; color: #64748b; margin: 10px 0 0;">Visit your dashboard to download your certificate.</p>
                    </div>
                    <p style="font-size: 14px; color: #64748b;">Keep up the great work! 🚀</p>
                    <p style="font-size: 14px; color: #94a3b8;">— The Skill Hub Team</p>
                </div>
            </div>
        `,
    });
};

module.exports = { sendEmail, sendEnrollmentEmail, sendPaymentSuccessEmail, sendCertificateEmail };
