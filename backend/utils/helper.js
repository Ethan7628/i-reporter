const nodemailer = require('nodemailer');

// Email configuration (you'll need to set up your email service)
const transporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email notification
const sendStatusUpdateEmail = async (userEmail, userName, recordTitle, newStatus) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'iReporter - Record Status Updated',
      html: `
        <h2>Hello ${userName},</h2>
        <p>The status of your record "<strong>${recordTitle}</strong>" has been updated to: <strong>${newStatus}</strong></p>
        <p>Thank you for using iReporter to make a difference in your community.</p>
        <br>
        <p>Best regards,<br>The iReporter Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Status update email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Format API responses
const formatResponse = (status, message, data = null) => {
  return {
    status,
    message,
    ...(data && { data })
  };
};

module.exports = {
  sendStatusUpdateEmail,
  formatResponse
};