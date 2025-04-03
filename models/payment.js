const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js'); // Ensure this path is correct

// Define the Payment model
class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: "User ID must be an integer",
        },
        notNull: {
          msg: "User ID is required",
        },
      },
    },
    payment_method: {
      type: DataTypes.ENUM('paypal', 'binance', 'mpesa', 'naira'),
      allowNull: false,
      validate: {
        notNull: {
          msg: "Payment method is required",
        },
        isIn: {
          args: [['paypal', 'binance', 'mpesa', 'naira']],
          msg: "Payment method must be one of 'paypal', 'binance', 'mpesa', 'naira'",
        },
      },
    },
    payment_proof: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Payment proof is required",
        },
      },
    },
    payment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: "Payment amount must be a valid decimal number",
        },
        notNull: {
          msg: "Payment amount is required",
        },
        min: 0.01, // Prevent 0 or negative amounts
      },
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    payment_date: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: "Subscription ID must be an integer",
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: false,
    underscored: true, // Convert column names to snake_case
  }
);

// Sync model with the database
sequelize.sync()
  .then(() => console.log('Payments table created or already exists.'))
  .catch((error) => console.error('Error creating payments table:', error));

// Define class methods for CRUD operations
class PaymentService {
  // ✅ Create a new payment
  static async createPayment(paymentData) {
    try {
      return await Payment.create(paymentData);
    } catch (error) {
      throw new Error(`Error creating payment: ${error.message}`);
    }
  }

  // ✅ Get payment by ID
  static async getPaymentById(id) {
    try {
      const payment = await Payment.findByPk(id);
      if (!payment) throw new Error('Payment not found.');
      return payment;
    } catch (error) {
      throw new Error(`Error fetching payment: ${error.message}`);
    }
  }

  // ✅ Get all payments for a user
  static async getPaymentsByUserId(user_id) {
    try {
      return await Payment.findAll({
        where: { user_id },
        order: [['payment_date', 'DESC']], // Order by payment date (newest first)
      });
    } catch (error) {
      throw new Error(`Error fetching payments for user: ${error.message}`);
    }
  }

  // ✅ Update payment status
  static async updatePaymentStatus(id, payment_status) {
    try {
      const [updated] = await Payment.update(
        { payment_status },
        { where: { id } }
      );
      return updated > 0; // Return true if update was successful
    } catch (error) {
      throw new Error(`Error updating payment status: ${error.message}`);
    }
  }

  // ✅ Delete payment record
  static async deletePayment(id) {
    try {
      const deleted = await Payment.destroy({ where: { id } });
      return deleted > 0; // Return true if deletion was successful
    } catch (error) {
      throw new Error(`Error deleting payment record: ${error.message}`);
    }
  }
}

module.exports = { Payment, PaymentService };
