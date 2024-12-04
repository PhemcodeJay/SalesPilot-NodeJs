const mysql = require('mysql2');

// Create database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dbs13455438',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Promisify the pool for async/await support
const db = pool.promise();

class ActivationCode {
  static async createActivationCodesTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS activation_codes (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT(11) NOT NULL,
        activation_code VARCHAR(100) NOT NULL,
        expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;
    await db.query(createTableQuery);
    console.log('Activation Codes table created or already exists.');
  }

  static async createActivationCodeRecord(activationData) {
    const insertQuery = `
      INSERT INTO activation_codes 
      (user_id, activation_code, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `;
    const { user_id, activation_code, expires_at, created_at } = activationData;

    try {
      const [result] = await db.query(insertQuery, [user_id, activation_code, expires_at, created_at]);
      return { id: result.insertId };
    } catch (error) {
      throw new Error(`Error creating activation code record: ${error.message}`);
    }
  }

  static async getActivationCodeById(id) {
    const query = `SELECT * FROM activation_codes WHERE id = ?`;

    try {
      const [rows] = await db.query(query, [id]);
      if (rows.length === 0) throw new Error('Activation Code record not found.');
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching activation code: ${error.message}`);
    }
  }

  static async getActivationCodesByUserId(userId) {
    const query = `SELECT * FROM activation_codes WHERE user_id = ? ORDER BY created_at DESC`;

    try {
      const [rows] = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching activation codes for user: ${error.message}`);
    }
  }

  static async updateActivationCode(id, updatedData) {
    const { user_id, activation_code, expires_at, created_at } = updatedData;

    const updateQuery = `
      UPDATE activation_codes
      SET user_id = ?, activation_code = ?, expires_at = ?, created_at = ?
      WHERE id = ?
    `;

    try {
      const [result] = await db.query(updateQuery, [user_id, activation_code, expires_at, created_at, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating activation code record: ${error.message}`);
    }
  }

  static async deleteActivationCode(id) {
    const deleteQuery = `DELETE FROM activation_codes WHERE id = ?`;

    try {
      const [result] = await db.query(deleteQuery, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting activation code record: ${error.message}`);
    }
  }
}

module.exports = ActivationCode;