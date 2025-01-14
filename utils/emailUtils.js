// utils/email.js
const nodemailer = require('nodemailer');

// Create a transporter object using a unified configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Replace with your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generic function to send an email
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error.message);
    throw new Error('Failed to send email');
  }
};

// Specific function to send account activation email
const sendActivationEmail = async (email, activationCode) => {
  const subject = 'Account Activation';
  const text = `Please activate your account using the following code: ${activationCode}`;
  try {
    await sendEmail(email, subject, text);
    console.log('Activation email sent to', email);
  } catch (error) {
    console.error('Failed to send activation email:', error.message);
  }
};

// Specific function to send password reset email
const sendPasswordResetEmail = async (email, resetCode) => {
  const subject = 'Password Reset';
  const text = `Please use the following code to reset your password: ${resetCode}`;
  try {
    await sendEmail(email, subject, text);
    console.log('Password reset email sent to', email);
  } catch (error) {
    console.error('Failed to send password reset email:', error.message);
  }
};

module.exports = { sendActivationEmail, sendPasswordResetEmail };
