const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/coordinates', (req, res) => weatherController.getWeatherByCoordinates(req, res));
router.get('/city', (req, res) => weatherController.getWeatherByCity(req, res));
router.get('/summary', (req, res) => weatherController.getWeatherSummary(req, res));

router.get('/', (req, res) => {
  const endpoints = [
    { method: 'GET', path: '/coordinates', description: 'Get weather by lat/lon', params: 'lat, lon', example: '/coordinates?lat=6.9271&lon=79.8612' },
    { method: 'GET', path: '/city', description: 'Get weather by city name', params: 'name, country (optional)', example: '/city?name=Colombo' },
    { method: 'GET', path: '/summary', description: 'Get summarized weather & risk', params: 'lat, lon optional', example: '/summary' }
  ];
  res.json({ status: 'success', message: 'Weather API - Member4 Safety Assistant', author: 'Gamage K.P (IT22202390)', availableEndpoints: endpoints });
});

module.exports = router;
