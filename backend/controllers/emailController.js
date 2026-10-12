const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

let transporter;

// Initialize real SMTP credentials
function initEmail() {
    try {
        transporter = nodemailer.createTransport({
            service: 'gmail', // You can use 'gmail' or configure host/port for other providers
            auth: {
                // To make this work, the user MUST provide their real email and app password in a .env file
                user: process.env.EMAIL_USER || 'your_email@gmail.com', 
                pass: process.env.EMAIL_PASS || 'your_app_password', 
            },
        });
        console.log(`>>> [BACKEND] Real Email Transporter configured for: ${process.env.EMAIL_USER || 'placeholder_email'}`);
    } catch (err) {
        console.error(">>> [BACKEND] Critical exception initializing nodemailer transporter", err);
    }
}

// Call init at startup
initEmail();

exports.sendStatusUpdateEmail = async (req, res) => {
    try {
        const { email, complaintId, oldStatus, newStatus, message } = req.body;

        if (!email || !complaintId || !newStatus) {
            return res.status(400).json({ success: false, message: 'Missing required fields for email notification' });
        }

        if (!transporter) {
            return res.status(500).json({ success: false, message: 'Email transporter not initialized yet' });
        }

        console.log(`>>> [BACKEND] Dispatching email to ${email} for CMP: ${complaintId}`);

        const mailOptions = {
            from: '"CitizenPortal Admin" <admin@citizenportal.local>',
            to: email,
            subject: `Complaint Status Updated - ${complaintId}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Complaint Status Updated</h2>
                    <p>Dear Citizen,</p>
                    <p>Your complaint (<strong>ID: ${complaintId}</strong>) has been updated.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Old Status:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span style="color: #666;">${oldStatus || 'N/A'}</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>New Status:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong style="color: #10b981;">${newStatus}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Timestamp:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date().toLocaleString()}</td>
                        </tr>
                    </table>
                    ${message ? `<p><strong>Message from Admin:</strong><br/> <span style="font-style: italic; color: #555;">"${message}"</span></p>` : ''}
                    <p style="margin-top: 20px; font-size: 0.9rem; color: #777;">Thank you for using the CitizenPortal.<br/>We are currently working on your issue.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log(">>> [BACKEND] Message sent: %s", info.messageId);

        res.status(200).json({ 
            success: true, 
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error(">>> [BACKEND] Email Dispatch failed:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.sendAuthEmail = async (req, res) => {
    try {
        const { email, name, type } = req.body;

        if (!email || !type) {
            return res.status(400).json({ success: false, message: 'Missing required fields for auth notification' });
        }

        if (!transporter) {
            return res.status(500).json({ success: false, message: 'Email transporter not initialized yet' });
        }

        let subject = '';
        let htmlContent = '';

        if (type === 'signup') {
            subject = 'Welcome to CitizenPortal!';
            htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Welcome, ${name || 'Citizen'}!</h2>
                    <p>Thank you for registering on the CitizenPortal.</p>
                    <p>Your account has been successfully created. You can now log in to submit and track your civil complaints.</p>
                    <p style="margin-top: 20px; font-size: 0.9rem; color: #777;">Regards,<br/>The CitizenPortal Team</p>
                </div>
            `;
        } else if (type === 'login') {
            subject = 'New Login Alert - CitizenPortal';
            htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Login Detected</h2>
                    <p>Dear ${name || 'Citizen'},</p>
                    <p>We noticed a new login to your CitizenPortal account at <strong>${new Date().toLocaleString()}</strong>.</p>
                    <p>If this was you, no further action is required. If you did not authorize this login, please contact support immediately.</p>
                    <p style="margin-top: 20px; font-size: 0.9rem; color: #777;">Stay safe,<br/>The CitizenPortal Team</p>
                </div>
            `;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid auth email type' });
        }

        const mailOptions = {
            from: '"CitizenPortal Admin" <admin@citizenportal.local>',
            to: email,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`>>> [BACKEND] Auth email (${type}) sent to ${email}: %s`, info.messageId);

        res.status(200).json({ success: true, message: 'Auth email sent successfully' });

    } catch (error) {
        console.error(">>> [BACKEND] Auth Email Dispatch failed:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
