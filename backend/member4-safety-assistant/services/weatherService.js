const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

class WeatherService {
  constructor() {
    // Use env vars when configured; fall back to the OpenWeatherMap free key and endpoint provided.
    // NOTE: For security, prefer setting WEATHER_API_KEY and WEATHER_API_URL in your environment.
    this.apiKey = process.env.WEATHER_API_KEY || 'ee2219cb62174095584e2239cdc0f669';
    this.apiUrl = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5/weather';
    console.info('WeatherService configured. Using API URL:', this.apiUrl);
    // Warn if using the embedded default key
    if (!process.env.WEATHER_API_KEY) console.warn('No WEATHER_API_KEY env var found — using the default API key (ensure this is intended).');
  }

  async getWeatherByCoordinates(lat, lon) {
    try {
      if (!this.apiKey) throw new Error('WEATHER_API_KEY is not configured');
      const resp = await axios.get(this.apiUrl, {
        params: { lat, lon, appid: this.apiKey, units: 'metric' }
      });
      return this.formatWeatherData(resp.data);
    } catch (err) {
      console.error('getWeatherByCoordinates error:', err.message);
      throw err;
    }
  }

  async getWeatherByCity(city, country = 'LK') {
    try {
      if (!this.apiKey) throw new Error('WEATHER_API_KEY is not configured');
      const q = `${city},${country}`;
      const resp = await axios.get(this.apiUrl, {
        params: { q, appid: this.apiKey, units: 'metric' }
      });
      return this.formatWeatherData(resp.data);
    } catch (err) {
      console.error('getWeatherByCity error:', err.message);
      throw err;
    }
  }

  formatWeatherData(data) {
    if (!data) return null;
    const coord = data.coord || {};
    const weather = (data.weather && data.weather[0]) || {};
    const main = data.main || {};
    const wind = data.wind || {};
    const rain = data.rain || {};

    return {
      location: {
        city: data.name || null,
        country: (data.sys && data.sys.country) || null,
        coordinates: { lat: coord.lat || null, lon: coord.lon || null }
      },
      weather: { main: weather.main || null, description: weather.description || null, icon: weather.icon || null },
      temperature: {
        current: main.temp ?? null,
        feelsLike: main.feels_like ?? null,
        min: main.temp_min ?? null,
        max: main.temp_max ?? null
      },
      conditions: {
        humidity: main.humidity ?? null,
        pressure: main.pressure ?? null,
        visibility: data.visibility ?? null,
        cloudiness: (data.clouds && data.clouds.all) || null
      },
      wind: { speed: wind.speed ?? null, direction: wind.deg ?? null, gust: wind.gust ?? null },
      rain: { oneHour: rain['1h'] ?? 0, threeHours: rain['3h'] ?? 0 },
      timestamp: { current: (data.dt ? new Date(data.dt * 1000).toISOString() : null), sunrise: (data.sys && data.sys.sunrise ? new Date(data.sys.sunrise * 1000).toISOString() : null), sunset: (data.sys && data.sys.sunset ? new Date(data.sys.sunset * 1000).toISOString() : null) }
    };
  }

  analyzeElectricalHazards(weatherData) {
    try {
      if (!weatherData) return { hasHazards: false, hazards: [], severity: { level: 'low', score: 0 }, requiresImmediateAction: false };

      const hazards = [];
      let score = 0;
      const w = weatherData.weather || {};
      const rain = weatherData.rain || {};
      const wind = weatherData.wind || {};
      const humidity = (weatherData.conditions && weatherData.conditions.humidity) || 0;

      // Thunderstorm / Lightning
      if (w.main && /thunderstorm|storm|thunder/i.test(w.main + ' ' + (w.description || ''))) {
        hazards.push({ type: 'lightning', severity: 'high', message: 'Thunderstorm/Lightning detected' });
        score += 40;
      }

      // Heavy rain checks
      const oneHr = Number(rain.oneHour || 0);
      const threeHr = Number(rain.threeHours || 0);
      if (oneHr > 10) {
        const sev = oneHr > Number(process.env.HEAVY_RAIN_THRESHOLD || 50) ? 'high' : 'medium';
        hazards.push({ type: 'heavy_rain', severity: sev, message: `Heavy rain expected (${oneHr} mm in last hour)` });
        score += oneHr > Number(process.env.HEAVY_RAIN_THRESHOLD || 50) ? 30 : 15;
      }

      // High wind
      const windSpeed = Number(wind.speed || 0);
      if (windSpeed > 15) {
        const sev = windSpeed > 25 ? 'high' : 'medium';
        hazards.push({ type: 'high_wind', severity: sev, message: `High wind expected (${windSpeed} m/s)` });
        score += windSpeed > 25 ? 20 : 10;
      }

      // Flood risk
      if (threeHr > 30 && humidity > 85) {
        hazards.push({ type: 'flood_risk', severity: 'high', message: 'Elevated flood risk due to prolonged heavy rain and high humidity' });
        score += 35;
      }

      const severityLevel = score >= 50 ? 'critical' : score >= 30 ? 'high' : score >= 15 ? 'medium' : 'low';
      const requiresImmediateAction = severityLevel === 'critical' || severityLevel === 'high';

      return { hasHazards: hazards.length > 0, hazards, severity: { level: severityLevel, score }, requiresImmediateAction };
    } catch (err) {
      console.error('analyzeElectricalHazards error:', err.message);
      return { hasHazards: false, hazards: [], severity: { level: 'low', score: 0 }, requiresImmediateAction: false };
    }
  }
}

module.exports = new WeatherService();
