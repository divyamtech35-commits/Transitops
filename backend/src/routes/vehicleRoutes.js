const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');

// All vehicle routes require authentication
router.use(verifyJWT);

// GET /api/vehicles ?status=&type=&region=
router.get('/', getVehicles);

// GET /api/vehicles/:id
router.get('/:id', getVehicleById);

// POST /api/vehicles [Fleet Manager]
router.post('/', requireRole(['FleetManager']), createVehicle);

// PUT /api/vehicles/:id [Fleet Manager]
router.put('/:id', requireRole(['FleetManager']), updateVehicle);

// DELETE /api/vehicles/:id [Fleet Manager]
router.delete('/:id', requireRole(['FleetManager']), deleteVehicle);

module.exports = router;
