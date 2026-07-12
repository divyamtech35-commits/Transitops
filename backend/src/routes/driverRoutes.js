const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver
} = require('../controllers/driverController');

// All driver routes require authentication
router.use(verifyJWT);

// GET /api/drivers ?status=
router.get('/', getDrivers);

// GET /api/drivers/:id
router.get('/:id', getDriverById);

// POST /api/drivers [Fleet Manager, Safety Officer]
router.post('/', requireRole(['FleetManager', 'SafetyOfficer']), createDriver);

// PUT /api/drivers/:id [Fleet Manager, Safety Officer]
router.put('/:id', requireRole(['FleetManager', 'SafetyOfficer']), updateDriver);

// DELETE /api/drivers/:id [Fleet Manager]
router.delete('/:id', requireRole(['FleetManager']), deleteDriver);

module.exports = router;
