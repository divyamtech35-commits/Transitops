const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const {
  getTrips,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
} = require('../controllers/tripController');

// All trip routes require authentication
router.use(verifyJWT);

// GET /api/trips ?status=
router.get('/', getTrips);

// Trips CRUD (FleetManager, Driver)
router.post('/', requireRole(['FleetManager', 'Driver']), createTrip);
router.put('/:id/dispatch', requireRole(['FleetManager', 'Driver']), dispatchTrip);
router.put('/:id/complete', requireRole(['FleetManager', 'Driver']), completeTrip);
router.put('/:id/cancel', requireRole(['FleetManager', 'Driver']), cancelTrip);

module.exports = router;
