exports.sendActivationEmail = async (email, code) => {
    const link = `${process.env.BASE_URL}/api/auth/activate/${code}`;
    // Send email with this link
  };
  
  exports.sendPasswordResetEmail = async (email, code) => {
    const link = `${process.env.BASE_URL}/reset-password.html?code=${code}`;
    // Send email with this link
  };
  const nodemailer = require('nodemailer');

// Configure Nodemailer (use your email provider settings)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password
  },
});

// Function to send the password reset email
const sendPasswordResetEmail = async (email, resetCode) => {
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
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendPasswordResetEmail,
};
