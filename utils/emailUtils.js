const nodemailer = require('nodemailer');

// Configure Nodemailer (use your email provider settings)
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use your preferred email service here
  auth: {
    user: process.env.EMAIL_USER,  // Your email address
    pass: process.env.EMAIL_PASS,  // Your email password or app-specific password
  },
});

// Function to send the activation email
exports.sendActivationEmail = async (email, code) => {
  const link = `${process.env.BASE_URL}/api/auth/activate/${code}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Activate Your Account',
    text: `Click the following link to activate your account: ${link}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending activation email:', error);
  }
};

// Function to send the password reset email
exports.sendPasswordResetEmail = async (email, resetCode) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetCode}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    text: `Click the following link to reset your password: ${resetLink}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};
