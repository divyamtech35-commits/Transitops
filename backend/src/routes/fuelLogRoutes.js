const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const {
  getFuelLogs,
  createFuelLog
} = require('../controllers/fuelLogController');

router.use(verifyJWT);

// GET /api/fuel-logs (FleetManager, Driver, FinancialAnalyst)
router.get('/', getFuelLogs);

// POST /api/fuel-logs (FleetManager, Driver, FinancialAnalyst)
router.post('/', requireRole(['FleetManager', 'Driver', 'FinancialAnalyst']), createFuelLog);

module.exports = router;
