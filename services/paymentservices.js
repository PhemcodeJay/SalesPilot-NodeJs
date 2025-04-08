// ===== Payment Service Class (CRUD Operations) =====
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
        if (!payment) throw new Error('Payment not found');
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
  
  // ===== Export Models and Services =====
  module.exports = { Payment, PaymentService };
  