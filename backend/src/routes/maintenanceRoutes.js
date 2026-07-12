const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const {
  getMaintenanceLogs,
  createMaintenanceLog,
  closeMaintenanceLog
} = require('../controllers/maintenanceController');

// All routes require authentication
router.use(verifyJWT);

// GET /api/maintenance (Any authenticated user can view)
router.get('/', getMaintenanceLogs);

// POST /api/maintenance (FleetManager only)
router.post('/', requireRole(['FleetManager']), createMaintenanceLog);

// PUT /api/maintenance/:id/close (FleetManager only)
router.put('/:id/close', requireRole(['FleetManager']), closeMaintenanceLog);

module.exports = router;
