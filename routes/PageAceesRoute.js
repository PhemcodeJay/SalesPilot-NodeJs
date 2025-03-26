const express = require("express");
const router = express.Router();
const PageAccessController = require("../controllers/PageAccessController");
const { authenticateUser } = require("../middleware/auth");

// ✅ Get all page access records (protected)
router.get("/", authenticateUser, PageAccessController.getAll);

// ✅ Get a single page access record by ID (protected)
router.get("/:id", authenticateUser, PageAccessController.getOne);

// ✅ Create a new page access record (protected)
router.post("/", authenticateUser, PageAccessController.create);

// ✅ Update a page access record by ID (protected)
router.put("/:id", authenticateUser, PageAccessController.update);

// ✅ Delete a page access record by ID (protected)
router.delete("/:id", authenticateUser, PageAccessController.delete);

module.exports = router;
