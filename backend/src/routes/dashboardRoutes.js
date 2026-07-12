const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { getDashboardKpis } = require('../controllers/dashboardController');

router.get('/kpis', verifyJWT, getDashboardKpis);

module.exports = router;
