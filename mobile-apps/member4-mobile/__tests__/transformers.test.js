import { normalizeWeatherData, normalizeEmergencyProtocol, normalizeSafetyTips, formatLocation } from '../services/transformers';

describe('transformers', () => {
  test('formatLocation handles string and object', () => {
    expect(formatLocation('Colombo')).toEqual({ city: 'Colombo', country: '', sub: '' });
    expect(formatLocation({ city: 'Colombo', country: 'LK' })).toEqual({ city: 'Colombo', country: 'LK', sub: '' });
    expect(formatLocation({ name: 'Galle', region: 'Southern' })).toEqual({ city: 'Galle', country: '', sub: 'Southern' });
  });

  test('normalizeWeatherData returns stable shape', () => {
    const raw = {
      weather: { temp: 28, condition: 'Light Rain', location: { city: 'Colombo', country: 'LK' } },
      riskAssessment: { score: 72, riskLevel: 'HIGH' },
      forecast: [{ label: 'Now', temp: 28, emoji: '🌧️' }],
      safetySuggestions: ['Unplug routers']
    };
    const out = normalizeWeatherData(raw);
    expect(out.weather.temp).toBe(28);
    expect(out.weather.location.city).toBe('Colombo');
    expect(out.riskAssessment.score).toBe(72);
    expect(Array.isArray(out.forecast)).toBe(true);
    expect(out.safetySuggestions.length).toBeGreaterThan(0);
  });

  test('normalizeEmergencyProtocol provides arrays', () => {
    const raw = { title: 'Flood', before: ['Turn off mains'], during: 'Stay away' }; // note: during is string
    const out = normalizeEmergencyProtocol(raw);
    expect(out.title).toBe('Flood');
    expect(Array.isArray(out.before)).toBe(true);
    expect(Array.isArray(out.during)).toBe(true);
  });

  test('normalizeSafetyTips provides arrays', () => {
    const raw = { daily: 'Keep dry', seasonal: ['Store important docs'] };
    const out = normalizeSafetyTips(raw);
    expect(Array.isArray(out.daily)).toBe(true);
    expect(Array.isArray(out.seasonal)).toBe(true);
  });
});
