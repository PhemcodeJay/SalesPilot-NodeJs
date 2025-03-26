const { Model, DataTypes, Op } = require("sequelize");
const crypto = require("crypto");
const bcryptUtils = require("../utils/bcryptUtils");
const { sequelize } = require("../config/db"); // Ensure correct import
const Tenant = require("./Tenant");
const Subscription = require("./subscriptions");

class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        username: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        location: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        role: {
          type: DataTypes.ENUM("sales", "admin", "manager"),
          defaultValue: "sales",
        },
        tenant_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        activation_token: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        activation_token_expiry: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        reset_token: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        reset_token_expiry: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "User",
        tableName: "users",
        timestamps: true,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Tenant, { foreignKey: "tenant_id", as: "tenant" });
    this.hasMany(models.Subscription, { foreignKey: "user_id", as: "subscriptions" });
  }

  /**
   * Register a new user
   */
  static async signup(userData) {
    const transaction = await sequelize.transaction();
    try {
      const {
        username,
        email,
        phone,
        password,
        confirm_password,
        location,
        role = "sales",
        subscription_plan = "trial",
        tenant_name,
      } = userData;

      if (!username || !email || !password || !confirm_password || !location || !tenant_name) {
        throw new Error("Missing required fields.");
      }

      if (password !== confirm_password) {
        throw new Error("Passwords do not match.");
      }

      // Check for existing user
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: sequelize.where(sequelize.fn("LOWER", sequelize.col("email")), email.toLowerCase()) },
            { username: sequelize.where(sequelize.fn("LOWER", sequelize.col("username")), username.toLowerCase()) },
          ],
        },
      });

      if (existingUser) {
        throw new Error("User with this email or username already exists.");
      }

      let tenant = await Tenant.findOne({ where: { name: tenant_name }, transaction });

      if (!tenant) {
        tenant = await Tenant.create(
          {
            name: tenant_name,
            email,
            phone,
            address: location,
            status: "inactive",
            subscription_type: subscription_plan,
            subscription_start_date: new Date(),
            subscription_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          },
          { transaction }
        );
      }

      const hashedPassword = await bcryptUtils.hashPassword(password);
      const activation_token = crypto.randomBytes(32).toString("hex");
      const activation_token_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiry

      const newUser = await User.create(
        {
          username,
          email,
          phone,
          password: hashedPassword,
          location,
          role,
          tenant_id: tenant.id,
          activation_token,
          activation_token_expiry,
          is_active: false,
        },
        { transaction }
      );

      await Subscription.create(
        {
          user_id: newUser.id,
          tenant_id: tenant.id,
          subscription_plan,
          start_date: new Date(),
          end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          is_free_trial_used: false,
        },
        { transaction }
      );

      await transaction.commit();

      return { success: true, message: "User registered. Activation email sent.", activation_token };
    } catch (error) {
      await transaction.rollback();
      console.error("Signup Error:", error.message);
      throw new Error("Signup failed. Please try again.");
    }
  }

  /**
   * Login user
   */
  static async login(email, password) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error("User not found.");

      const isMatch = await bcryptUtils.comparePassword(password, user.password);
      if (!isMatch) throw new Error("Invalid credentials.");

      if (!user.is_active) throw new Error("Account not activated. Check your email.");

      return { success: true, user };
    } catch (error) {
      console.error("Login Error:", error.message);
      throw new Error("Login failed. Check credentials.");
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error("User not found.");

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1-hour expiry

      await user.update({ reset_token: resetToken, reset_token_expiry: expiry });

      return { success: true, message: "Password reset request sent.", resetToken };
    } catch (error) {
      console.error("Request Password Reset Error:", error.message);
      throw new Error("Password reset request failed.");
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(resetToken, newPassword, confirmPassword) {
    try {
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");

      const user = await User.findOne({
        where: {
          reset_token: resetToken,
          reset_token_expiry: { [Op.gt]: new Date() },
        },
      });

      if (!user) throw new Error("Invalid or expired reset token.");

      const hashedPassword = await bcryptUtils.hashPassword(newPassword);

      await user.update({ password: hashedPassword, reset_token: null, reset_token_expiry: null });

      return { success: true, message: "Password reset successfully." };
    } catch (error) {
      console.error("Reset Password Error:", error.message);
      throw new Error("Password reset failed.");
    }
  }

  /**
   * Find a user by query
   */
  static async findOneUser(query) {
    try {
      if (!query || typeof query !== "object" || !query.where) {
        throw new Error("Invalid query object.");
      }

      return await User.findOne(query);
    } catch (error) {
      console.error("FindUser Error:", error.message);
      throw new Error("User lookup failed.");
    }
  }
}

module.exports = User;
