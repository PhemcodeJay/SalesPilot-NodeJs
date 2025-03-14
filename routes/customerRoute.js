const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const customerController = require('../controllers/customercontroller');
const { validateLogin } = require('../middleware/auth'); // Import middleware
const pool = require('../models/db'); // Import the database connection
const session = require('express-session');
const multer = require('multer');
const PDFDocument = require('pdfkit');

// Serve static files (CSS, JS, images, etc.)
router.use(express.static(path.join(__dirname, '../views/customers')));

// Route to serve the page for adding a customer
router.get('/add-customer', validateLogin, (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', 'views/customers', 'page-add-customer.html');
        res.sendFile(filePath);
    } catch (err) {
        console.error("Error serving add-customer page:", err);
        res.status(500).json({ message: 'Error loading the page' });
    }
});

// Route to serve the page listing all customers
router.get('/list-customer', validateLogin, async (req, res) => {
    try {
        const customers = await customerController.fetchAllCustomers();
        res.render('page-list-customer', { customers });
    } catch (err) {
        console.error("Error fetching customers:", err);
        res.status(500).json({ message: 'Error fetching customers' });
    }
});

// Route to handle customer actions (CRUD operations)
router.post('/customer/actions', validateLogin, async (req, res) => {
    try {
        await customerController.handleCustomerActions(req, res);
    } catch (err) {
        console.error("Error handling customer action:", err);
        res.status(500).json({ message: 'Error processing request' });
    }
});

// Route to export customer details to PDF
router.get('/customer/pdf/:customer_id', validateLogin, async (req, res) => {
    const { customer_id } = req.params;

    try {
        const doc = await customerController.exportCustomerToPDF(customer_id);
        const filePath = path.join(__dirname, '..', 'temp', `customer_${customer_id}.pdf`);

        // Create write stream for the PDF
        const fileStream = fs.createWriteStream(filePath);
        doc.pipe(fileStream);

        fileStream.on('finish', () => {
            res.download(filePath, `customer_${customer_id}.pdf`, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    return res.status(500).json({ message: 'Error exporting PDF' });
                }
                fs.unlinkSync(filePath); // Clean up temp file
            });
        });

        doc.end();
    } catch (err) {
        console.error("Error exporting PDF:", err);
        res.status(500).json({ message: 'Error exporting PDF' });
    }
});

// Route to generate and download the customers report PDF
router.get('/customers/report/pdf', validateLogin, async (req, res) => {
    try {
        await customerController.generateCustomerReportPdf(req, res); // Method name fixed
    } catch (err) {
        console.error("Error generating report:", err);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Centralized Error Handling Middleware
router.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Export the router for use in the main app file
module.exports = router;
