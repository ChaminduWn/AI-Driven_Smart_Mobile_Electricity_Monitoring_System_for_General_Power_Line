const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safetyController');

router.get('/emergency/:disasterType', (req, res) => safetyController.getEmergencyProtocol(req, res));
router.get('/emergency', (req, res) => safetyController.getAllEmergencyProtocols(req, res));
router.get('/appliance/:applianceType', (req, res) => safetyController.getApplianceGuidelines(req, res));
router.get('/tips', (req, res) => safetyController.getGeneralSafetyTips(req, res));

router.get('/', (req, res) => {
  const endpoints = [
    { method: 'GET', path: '/emergency/:disasterType', description: 'Get emergency protocol for a disaster', params: 'disasterType', example: '/emergency/flood' },
    { method: 'GET', path: '/emergency', description: 'Get all emergency protocols', params: 'none', example: '/emergency' },
    { method: 'GET', path: '/appliance/:applianceType', description: 'Get appliance safety guidelines', params: 'applianceType, condition(optional)', example: '/appliance/refrigerator?condition=duringThunderstorm' },
    { method: 'GET', path: '/tips', description: 'Get general electrical safety tips', params: 'none', example: '/tips' }
  ];
  res.json({ status: 'success', message: 'Safety API - Member4 Safety Assistant', author: 'Gamage K.P (IT22202390)', availableEndpoints: endpoints });
});

module.exports = router;
