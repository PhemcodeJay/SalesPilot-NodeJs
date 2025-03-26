const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../db'); // Assuming db.js exports a Sequelize instance

class Payment extends Model {}

// Define the Payment model
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
    },
    payment_method: {
      type: DataTypes.ENUM('paypal', 'binance', 'mpesa', 'naira'),
      allowNull: false,
    },
    payment_proof: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: false,
  }
);

// Sync model with database
sequelize.sync()
  .then(() => console.log('Payments table created or already exists.'))
  .catch((error) => console.error('Error creating payments table:', error));

// Define class methods
class PaymentService {
  static async createPayment(paymentData) {
    try {
      return await Payment.create(paymentData);
    } catch (error) {
      throw new Error(`Error creating payment: ${error.message}`);
    }
  }

  static async getPaymentById(id) {
    try {
      const payment = await Payment.findByPk(id);
      if (!payment) throw new Error('Payment not found.');
      return payment;
    } catch (error) {
      throw new Error(`Error fetching payment: ${error.message}`);
    }
  }

  static async getPaymentsByUserId(user_id) {
    try {
      return await Payment.findAll({
        where: { user_id },
        order: [['payment_date', 'DESC']],
      });
    } catch (error) {
      throw new Error(`Error fetching payments for user: ${error.message}`);
    }
  }

  static async updatePaymentStatus(id, payment_status) {
    try {
      const [updated] = await Payment.update(
        { payment_status },
        { where: { id } }
      );
      return updated > 0;
    } catch (error) {
      throw new Error(`Error updating payment status: ${error.message}`);
    }
  }

  static async deletePayment(id) {
    try {
      const deleted = await Payment.destroy({ where: { id } });
      return deleted > 0;
    } catch (error) {
      throw new Error(`Error deleting payment record: ${error.message}`);
    }
  }
}

module.exports = { Payment, PaymentService };
