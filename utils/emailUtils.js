const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Ensure this is imported
const { User } = require('../models'); // Import User model

// Configure Nodemailer (use your email provider settings)
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Change to your preferred email service
  auth: {
    user: process.env.EMAIL_USER,  // Your email address
    pass: process.env.EMAIL_PASS,  // Your email password or app-specific password
  },
});

// Function to send the activation email
async function sendActivationEmail(email, code) {
  const link = `${process.env.BASE_URL}/api/auth/activate/${code}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Activate Your Account',
    html: `
      <h2>Welcome to Our Service</h2>
      <p>To activate your account, click the following link:</p>
      <a href="${link}">${link}</a>
      <p>If you did not request this activation, please ignore this email.</p>
    `, // HTML formatted email
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Activation email sent to:', email);
  } catch (error) {
    console.error('Error sending activation email:', error.message);
  }
}

// Function to send the password reset email
async function sendPasswordResetEmail(user) {
  // Generate a reset token
  const token = crypto.randomBytes(20).toString('hex');

  // Set the token to the user's record in the database with an expiration time (e.g., 1 hour)
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in milliseconds
  await user.save();

  // Construct the reset link
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  // Email subject and message with HTML formatting
  const subject = 'Password Reset Request';
  const message = `
    <h3>Hello ${user.name},</h3>
    <p>You requested a password reset. To reset your password, click the link below:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
    <p>Thanks,<br />The YourApp Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: subject,
    html: message,  // HTML formatted email
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', user.email);
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
  }
}

// Export the functions for use in other parts of your application
module.exports = {
  sendActivationEmail,
  sendPasswordResetEmail,
};
