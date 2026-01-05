const weatherService = require('../services/weatherService');
const safetyLogicService = require('../services/safetyLogicService');

class WeatherController {
  async getWeatherByCoordinates(req, res) {
    try {
      const { lat, lon } = req.query;
      if (lat == null || lon == null) {
        return res.status(400).json({ status: 'error', message: 'lat and lon query parameters are required. Example: /coordinates?lat=6.9271&lon=79.8612' });
      }

      const latN = Number(lat);
      const lonN = Number(lon);
      if (Number.isNaN(latN) || Number.isNaN(lonN) || latN < -90 || latN > 90 || lonN < -180 || lonN > 180) {
        return res.status(400).json({ status: 'error', message: 'Invalid lat/lon values. Latitude must be between -90 and 90, longitude between -180 and 180.' });
      }

      const weather = await weatherService.getWeatherByCoordinates(latN, lonN);
      const hazardAnalysis = weatherService.analyzeElectricalHazards(weather);
      const safetySuggestions = safetyLogicService.generateSafetySuggestions(weather, hazardAnalysis);
      const riskAssessment = safetyLogicService.assessRiskLevel(weather, hazardAnalysis);

      return res.status(200).json({ status: 'success', data: { weather, hazardAnalysis, safetySuggestions, riskAssessment }, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('getWeatherByCoordinates error:', err.message);
      return res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
  }

  async getWeatherByCity(req, res) {
    try {
      const { name, country = 'LK' } = req.query;
      if (!name) return res.status(400).json({ status: 'error', message: 'City name is required. Example: /city?name=Colombo' });

      const weather = await weatherService.getWeatherByCity(name, country);
      const hazardAnalysis = weatherService.analyzeElectricalHazards(weather);
      const safetySuggestions = safetyLogicService.generateSafetySuggestions(weather, hazardAnalysis);
      const riskAssessment = safetyLogicService.assessRiskLevel(weather, hazardAnalysis);

      return res.status(200).json({ status: 'success', data: { weather, hazardAnalysis, safetySuggestions, riskAssessment }, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('getWeatherByCity error:', err.message);
      return res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
  }

  async getWeatherSummary(req, res) {
    try {
      const lat = req.query.lat ?? process.env.DEFAULT_LAT;
      const lon = req.query.lon ?? process.env.DEFAULT_LON;
      const weather = await weatherService.getWeatherByCoordinates(Number(lat), Number(lon));
      const hazardAnalysis = weatherService.analyzeElectricalHazards(weather);
      const riskAssessment = safetyLogicService.assessRiskLevel(weather, hazardAnalysis);

      const summary = {
        location: weather.location,
        temperature: weather.temperature,
        condition: weather.weather,
        riskLevel: riskAssessment.riskLevel,
        hasHazards: hazardAnalysis.hasHazards,
        recommendation: riskAssessment.recommendation
      };

      return res.status(200).json({ status: 'success', data: summary, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('getWeatherSummary error:', err.message);
      return res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
  }
}

module.exports = new WeatherController();
