const { signUp, login, logout, passwordResetRequest, passwordResetConfirm } = require('../services/authService');
const { sendActivationEmail } = require('../services/activationCodeService');
const { createSubscription } = require('../services/subscriptionService');
const { rateLimitActivationRequests } = require('../middleware/rateLimiter');

// SignUp Controller (using authService for sign up and sending activation email)
const signUpController = async (req, res) => {
  const { 
    username, 
    email, 
    password, 
    phone, 
    location, 
    tenantName, 
    tenantEmail, 
    tenantPhone, 
    tenantAddress 
  } = req.body;

  try {
    // Rate-limit activation email requests
    const isRateLimited = await rateLimitActivationRequests(email);
    if (isRateLimited) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Check if the tenant already exists by email or name (optional validation)
    const existingTenant = await Tenant.findOne({ where: { email: tenantEmail } });
    if (existingTenant) {
      return res.status(400).json({ error: 'Tenant with this email already exists.' });
    }

    // Check if the user already exists by email
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Start a transaction for ensuring both user, tenant, subscription, and activation code creation
    const transaction = await sequelize.transaction();

    try {
      // Create Tenant
      const tenant = await Tenant.create({
        name: tenantName,
        email: tenantEmail,
        phone: tenantPhone,
        address: tenantAddress,
        status: 'inactive',  // Start as inactive
        subscription_start_date: new Date(),
        subscription_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),  // 1-year default
      }, { transaction });

      // Hash Password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create User (associated with the created tenant)
      const user = await User.create({
        tenant_id: tenant.id,  // Ensure the user is associated with the tenant
        username,
        email,
        password: hashedPassword,
        role: 'sales',  // Default role
        phone,
        location,
      }, { transaction });

      // Create Subscription (linked to the user now)
      await Subscription.create({
        user_id: user.id,  // Associate the subscription with the user
        type: 'trial',  // Default subscription type
        start_date: new Date(),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),  // 1-year duration
      }, { transaction });

      // Generate Activation Code
      const activationCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-character code
      const hashedActivationCode = await bcrypt.hash(activationCode, 10); // Hash the activation code for storage

      // Create Activation Code (associated with the created user)
      await ActivationCode.create({
        user_id: user.id,
        activation_code: hashedActivationCode,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 24 hours expiration
      }, { transaction });

      // Send Activation Email (handles saving to ActivationCode model + sends email)
      await sendActivationEmail(user, activationCode);

      // Commit the transaction
      await transaction.commit();

      // Send success response
      res.status(201).json({
        message: 'User and tenant registered successfully. Please check your email to activate your account.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          location: user.location,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
          address: tenant.address,
          status: tenant.status,
        },
      });
    } catch (err) {
      // Rollback transaction if an error occurs
      await transaction.rollback();
      console.error('Error during sign up transaction:', err);
      res.status(500).json({ error: 'Error registering user, tenant, subscription, or activation code. Please try again.' });
    }

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Error registering user. Please try again.' });
  }
};


// Login Controller (using authService for login)
const loginController = async (req, res) => {
  const { email, password, tenant_id } = req.body;

  try {
    // Call the service method to handle the login
    const { user, token } = await login({ email, password, tenant_id });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout Controller (clear the token cookie)
const logoutController = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

// Password Reset Request Controller (using authService for password reset request)
const passwordResetRequestController = async (req, res) => {
  const { email } = req.body;

  try {
    // Call the service method to handle password reset request
    await passwordResetRequest(email);
    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ error: 'Error processing password reset request' });
  }
};

// Password Reset Confirmation Controller (using authService for password reset confirmation)
const passwordResetConfirmController = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Call the service method to handle password reset confirmation
    await passwordResetConfirm(token, newPassword);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset confirmation error:', err);
    res.status(500).json({ error: 'Error resetting password' });
  }
};

// User Registration Controller (separate for handling user data and tenant data)
const registerUser = async (req, res) => {
  try {
    const { userData, tenantData } = req.body;
    const { user, tenant } = await signUp(userData, tenantData);
    res.status(201).json({
      message: 'User registered successfully. Please check your email for activation instructions.',
      user,
      tenant,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Account Activation Controller (to activate user account)
const activateUser = async (req, res) => {
  try {
    const { userId, activationCode } = req.query;
    await verifyActivationCode(activationCode, userId);
    res.status(200).json({ message: 'Account activated successfully.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  signUpController,
  loginController,
  logoutController,
  passwordResetRequestController,
  passwordResetConfirmController,
  registerUser,
  activateUser,
};
