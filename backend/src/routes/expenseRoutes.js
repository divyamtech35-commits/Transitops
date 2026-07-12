const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const {
  getExpenses,
  createExpense
} = require('../controllers/expenseController');

router.use(verifyJWT);

// GET /api/expenses (FleetManager, FinancialAnalyst)
// Driver is explicitly blocked here per RBAC.
router.get('/', requireRole(['FleetManager', 'FinancialAnalyst']), getExpenses);

// POST /api/expenses (FleetManager, FinancialAnalyst)
router.post('/', requireRole(['FleetManager', 'FinancialAnalyst']), createExpense);

module.exports = router;
