const express = require('express');
const router = express.Router();
const generatePDF = require('../generatepdf');  // Your PDF generation middleware
const { validateLogin } = require('../middleware/auth'); // Import middleware
// Route to generate and download the PDF
router.get('/generate-pdf', generatePDF);

module.exports = router;
