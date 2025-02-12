const express = require('express');
const { validateLogin } = require('../middleware/auth');
const supplierController = require('../controllers/suppliercontroller'); // Ensure this path is correct

const router = express.Router();

// Supplier CRUD routes
router.get('/suppliers', validateLogin, supplierController.getSuppliers);
router.get('/suppliers/:supplier_id', validateLogin, supplierController.getSupplierById);
router.post('/suppliers', validateLogin, supplierController.addSupplier);
router.put('/suppliers/:supplier_id', validateLogin, supplierController.updateSupplier);
router.delete('/suppliers/:supplier_id', validateLogin, supplierController.deleteSupplier);

// PDF generation route
router.get('/suppliers/pdf/:supplier_id', validateLogin, supplierController.generateSupplierPDF);

module.exports = router;
