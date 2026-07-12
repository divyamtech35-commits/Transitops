const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const { getFleetReport } = require('../controllers/reportController');

// All report routes require authentication
router.use(verifyJWT);

// GET /api/reports/fleet [FleetManager, FinancialAnalyst, SafetyOfficer]
router.get('/fleet', requireRole(['FleetManager', 'FinancialAnalyst', 'SafetyOfficer']), getFleetReport);

module.exports = router;
