const express = require('express');
const path = require('path');
const router = express.Router();
const {
    generateInvoicesPdf,
    createInvoice,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    generateInvoicePDF,
} = require('../controllers/invoicecontroller');
const { validateLogin } = require('../middleware/auth');

// Serve the invoice list page
router.get('/pages-invoice', validateLogin, (req, res) => {
    const filePath = path.resolve(__dirname, '../views/invoices/pages-invoice.html'); // Correct path
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err.message);
            res.status(500).send('Server Error: Unable to load the page.');
        }
    });
});


// Serve the invoice form page for creating or editing an invoice
router.get('/invoice-form', validateLogin, (req, res) => {
    const filePath = path.resolve(__dirname, '../views/invoices/invoice-form.html'); // Correct path
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err.message);
            res.status(500).send('Server Error: Unable to load the invoice form page.');
        }
    });
});


// Generate a PDF report of all invoices
router.get('/generate-pdf', validateLogin, generateInvoicesPdf);

// Create a new invoice
router.post('/create', validateLogin, (req, res) => {
    const { invoiceData, itemsData } = req.body;
    createInvoice(invoiceData, itemsData, (err, invoiceId) => {
        if (err) {
            return res.status(500).json({ message: 'Error creating invoice', error: err.message });
        }
        res.status(201).json({ message: 'Invoice created successfully', invoiceId });
    });
});

// Get a specific invoice by ID
router.get('/:invoiceId', validateLogin, (req, res) => {
    const invoiceId = req.params.invoiceId;
    getInvoice(invoiceId, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching invoice', error: err.message });
        }
        res.status(200).json(data);
    });
});

// Update an invoice
router.put('/:invoiceId', validateLogin, (req, res) => {
    const invoiceId = req.params.invoiceId;
    const invoiceData = req.body;
    updateInvoice(invoiceId, invoiceData, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating invoice', error: err.message });
        }
        res.status(200).json({ message: 'Invoice updated successfully' });
    });
});

// Delete an invoice
router.delete('/:invoiceId', validateLogin, (req, res) => {
    const invoiceId = req.params.invoiceId;
    deleteInvoice(invoiceId, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error deleting invoice', error: err.message });
        }
        res.status(200).json({ message: 'Invoice deleted successfully' });
    });
});

// Generate a PDF for a single invoice
router.get('/:invoiceId/generate-pdf', validateLogin, (req, res) => {
    const invoiceId = req.params.invoiceId;
    generateInvoicePDF(invoiceId, (err, filePath) => {
        if (err) {
            return res.status(500).json({ message: 'Error generating invoice PDF', error: err.message });
        }
        res.status(200).json({ message: 'Invoice PDF generated successfully', filePath });
    });
});

module.exports = router;
