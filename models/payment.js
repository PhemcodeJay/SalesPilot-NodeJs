const { models } = require("../config/db.js"); // Import models from centralized db.js
const { Sequelize, DataTypes, Model } = require('sequelize');

// Use the centralized sequelize instance from db.js
const sequelize = models.sequelize;

// ===== Define the Payment Model =====
class Payment extends Model {}

Payment.init({
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
}, {
  sequelize,
  modelName: 'Payment',
  tableName: 'payments',
  timestamps: false,
  underscored: true, // Convert column names to snake_case
});

// Sync model with the database
async function syncDatabase() {
  try {
    await sequelize.sync();
    console.log('✅ Payments table created or already exists.');
  } catch (error) {
    console.error('❌ Error creating payments table:', error.message);
  }
}

syncDatabase();

module.exports = Payment;
