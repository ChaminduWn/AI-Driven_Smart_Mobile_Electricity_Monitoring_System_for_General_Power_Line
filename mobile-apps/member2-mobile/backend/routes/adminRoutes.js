const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Dashboard Overview
router.get('/dashboard', adminController.getDashboardMetrics);

// Technicians
router.get('/technicians', adminController.getTechnicians);
router.put('/technicians/:id/status', adminController.updateTechnicianStatus);

// Users (Householders)
router.get('/users', adminController.getUsers);
router.put('/users/:id/suspend', adminController.updateUserSuspension);

// Services
router.get('/services', adminController.getServices);
router.put('/services/:id', adminController.updateService);
// router.post('/services', adminController.createService); // Future extension

module.exports = router;
