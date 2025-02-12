const express = require('express');
const path = require('path');
const expenseController = require('../controllers/expensecontroller');  // Import the expense controller
const { validateLogin } = require('../middleware/auth'); // Import middleware
const router = express.Router();

// Serve static files (CSS, JS, images, etc.) from the 'public' folder
router.use(express.static(path.join(__dirname, '../public')));

// Serve the 'page-add-expenses.html' page to add an expense
router.get('/add-expense', validateLogin, (req, res) => {
    const filePath = path.join(__dirname, '..', 'public', 'page-add-expenses.html');
    res.sendFile(filePath);
});

// Serve the 'page-list-expenses.html' page to list all expenses
router.get('/list-expenses', validateLogin, async (req, res) => {
    try {
        const expenses = await expenseController.getAllExpenses(req, res);
        res.render('page-list-expenses', { expenses });
    } catch (err) {
        console.error("Error fetching expenses: ", err);
        res.status(500).json({ message: 'Error fetching expenses' });
    }
});

// Handle expense actions (e.g., save, update, delete, PDF generation)

// Adding new expense
router.post('/expense', validateLogin, expenseController.addExpense);

// Updating an existing expense
router.put('/expense/:id', validateLogin, expenseController.updateExpense);

// Deleting an expense
router.delete('/expense/:id', validateLogin, expenseController.deleteExpense);

// Generate PDF report of all expenses
router.get('/expenses/pdf', validateLogin, expenseController.generateExpensesPdf);

// Fetch all expenses (for use in analytics or as JSON for list display)
router.get('/expenses', validateLogin, async (req, res) => {
    try {
        const expenses = await expenseController.getAllExpenses(req, res);
        res.json(expenses);
    } catch (err) {
        console.error("Error fetching expenses: ", err);
        res.status(500).json({ message: 'Error fetching expenses' });
    }
});

// Fetch a specific expense by its ID
router.get('/expense/:id', validateLogin, expenseController.getExpenseById);

// Get total expenses (for reporting or analytics)
router.get('/expenses/total', validateLogin, expenseController.getTotalExpenses);

module.exports = router;
