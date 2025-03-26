const express = require("express");
const router = express.Router();
const PasswordResetController = require("../controllers/PasswordResetController");
const { authenticateUser } = require("../middleware/auth");

// ✅ CRUD Routes for Password Resets
router.post("/", authenticateUser, PasswordResetController.createPasswordResetRecord);
router.get("/:id", authenticateUser, PasswordResetController.getPasswordResetById);
router.get("/user/:user_id", authenticateUser, PasswordResetController.getPasswordResetByUserId);
router.put("/:id", authenticateUser, PasswordResetController.updatePasswordReset);
router.delete("/:id", authenticateUser, PasswordResetController.deletePasswordReset);

module.exports = router;
