import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/**
 * Email configuration and utility functions
 * Handles sending OTP verification emails and status update notifications
 */

// Email transporter configuration
let transporter: Transporter;

/**
 * Initialize the nodemailer transporter with Gmail SMTP settings
 * This function MUST be called before sending any emails
 * 
 * Environment variables required:
 * - EMAIL_USER: Gmail address to send emails from
 * - EMAIL_PASSWORD: Gmail app password (not regular password)
 * 
 * @throws Error if email credentials are not configured
 */
export const initializeEmailTransporter = (): void => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  // Validate that email credentials are present
  if (!emailUser || !emailPassword) {
    console.warn('⚠️  Email credentials not configured. Email features will be disabled.');
    console.warn('   Please set EMAIL_USER and EMAIL_PASSWORD in your .env file');
    return;
  }

  // Create transporter using Gmail SMTP
  // For Gmail, you need to use an "App Password" instead of your regular password
  // Generate one at: https://myaccount.google.com/apppasswords
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  console.log('✅ Email transporter initialized successfully');
};

/**
 * Generate a random 6-digit OTP (One-Time Password)
 * Used for email verification during user signup
 * 
 * @returns {string} A 6-digit numeric OTP
 * 
 * @example
 * const otp = generateOTP(); // Returns: "123456"
 */
export const generateOTP = (): string => {
  // Generate random number between 100000 and 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP verification email to new user during signup
 * 
 * Email contains:
 * - 6-digit OTP code
 * - User's name for personalization
 * - Expiration time (10 minutes)
 * - Instructions for verification
 * 
 * @param {string} email - Recipient's email address
 * @param {string} otp - 6-digit OTP code to send
 * @param {string} firstName - User's first name for personalization
 * @returns {Promise<boolean>} True if email sent successfully, false otherwise
 * 
 * @example
 * const success = await sendOTPEmail('user@example.com', '123456', 'John');
 */
export const sendOTPEmail = async (
  email: string,
  otp: string,
  firstName: string
): Promise<boolean> => {
  // Check if transporter is initialized
  if (!transporter) {
    console.error('❌ Email transporter not initialized. Cannot send OTP email.');
    return false;
  }

  try {
    // Compose HTML email with OTP
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Welcome to iReporter!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <p>Thank you for signing up! To complete your registration, please verify your email address using the OTP code below:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
              <p class="otp-code">${otp}</p>
            </div>
            
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            
            <p>If you didn't request this code, please ignore this email.</p>
            
            <div class="warning">
              ⚠️ Never share this code with anyone. iReporter staff will never ask for your OTP.
            </div>
          </div>
          <div class="footer">
            <p>© 2024 iReporter - Fighting Corruption Together</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using configured transporter
    const info = await transporter.sendMail({
      from: `"iReporter" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - iReporter',
      html: htmlContent,
    });

    console.log('✅ OTP email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return false;
  }
};

/**
 * Send email notification when admin changes report status
 * 
 * Notifies the user when their report status changes to:
 * - under-investigation: Admin is reviewing the report
 * - resolved: Report has been addressed and closed
 * - rejected: Report was determined to be invalid
 * 
 * @param {string} email - User's email address
 * @param {string} firstName - User's first name for personalization
 * @param {string} reportTitle - Title of the report that was updated
 * @param {string} oldStatus - Previous status of the report
 * @param {string} newStatus - New status of the report
 * @param {string} reportType - Type of report ('red-flag' or 'intervention')
 * @returns {Promise<boolean>} True if email sent successfully, false otherwise
 * 
 * @example
 * await sendStatusUpdateEmail(
 *   'user@example.com',
 *   'John',
 *   'Broken Road in Downtown',
 *   'draft',
 *   'under-investigation',
 *   'intervention'
 * );
 */
export const sendStatusUpdateEmail = async (
  email: string,
  firstName: string,
  reportTitle: string,
  oldStatus: string,
  newStatus: string,
  reportType: string
): Promise<boolean> => {
  // Check if transporter is initialized
  if (!transporter) {
    console.error('❌ Email transporter not initialized. Cannot send status update email.');
    return false;
  }

  try {
    // Map status to user-friendly display text
    const statusMessages: Record<string, { title: string; message: string; color: string; icon: string }> = {
      'under-investigation': {
        title: 'Under Investigation',
        message: 'Great news! An administrator has begun investigating your report. We take all reports seriously and will keep you updated on the progress.',
        color: '#3498db',
        icon: '🔍'
      },
      'resolved': {
        title: 'Resolved',
        message: 'Excellent! Your report has been investigated and the issue has been resolved. Thank you for helping fight corruption and improve our community!',
        color: '#27ae60',
        icon: '✅'
      },
      'rejected': {
        title: 'Rejected',
        message: 'After careful review, this report has been rejected. This may be due to insufficient evidence, duplicate reporting, or the issue not meeting our criteria. You can submit a new report with additional details if needed.',
        color: '#e74c3c',
        icon: '❌'
      }
    };

    // Get status-specific content or use defaults
    const statusInfo = statusMessages[newStatus] || {
      title: newStatus,
      message: `Your report status has been updated from "${oldStatus}" to "${newStatus}".`,
      color: '#95a5a6',
      icon: 'ℹ️'
    };

    // Format report type for display
    const reportTypeDisplay = reportType === 'red-flag' ? 'Red Flag' : 'Intervention';

    // Compose HTML email with status update
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-box { background: white; border-left: 5px solid ${statusInfo.color}; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .status-title { color: ${statusInfo.color}; font-size: 24px; font-weight: bold; margin: 0; }
          .report-info { background: white; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .report-info p { margin: 5px 0; }
          .label { font-weight: bold; color: #666; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Report Status Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            
            <div class="status-box">
              <p style="font-size: 36px; margin: 0;">${statusInfo.icon}</p>
              <p class="status-title">${statusInfo.title}</p>
              <p style="margin-top: 15px;">${statusInfo.message}</p>
            </div>
            
            <div class="report-info">
              <p><span class="label">Report Type:</span> ${reportTypeDisplay}</p>
              <p><span class="label">Report Title:</span> ${reportTitle}</p>
              <p><span class="label">Previous Status:</span> ${oldStatus}</p>
              <p><span class="label">New Status:</span> ${newStatus}</p>
            </div>
            
            <p>You can view your report details by logging into your iReporter dashboard.</p>
            
            <p>Thank you for using iReporter to help create a better, more transparent community!</p>
          </div>
          <div class="footer">
            <p>© 2024 iReporter - Fighting Corruption Together</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using configured transporter
    const info = await transporter.sendMail({
      from: `"iReporter" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Report Status Updated: ${statusInfo.title} - ${reportTitle}`,
      html: htmlContent,
    });

    console.log('✅ Status update email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
    return false;
  }
};
