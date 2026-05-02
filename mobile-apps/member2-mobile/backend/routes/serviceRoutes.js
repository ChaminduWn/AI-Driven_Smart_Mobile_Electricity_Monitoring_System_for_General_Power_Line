const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/mobile', serviceController.getMobileServices);
router.get('/technician-setup/:electricianId', serviceController.getTechnicianSetupServices);

module.exports = router;
