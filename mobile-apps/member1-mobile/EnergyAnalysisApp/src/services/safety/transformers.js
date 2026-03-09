export function formatLocation(loc) {
  if (!loc) return { city: 'Unknown', country: '', sub: '' };
  if (typeof loc === 'string') return { city: loc, country: '', sub: '' };
  return {
    city: loc.city ?? loc.name ?? loc.label ?? 'Unknown',
    country: loc.country ?? loc.countryName ?? loc.cc ?? '',
    sub: loc.sub ?? loc.state ?? loc.region ?? '',
  };
}

export function normalizeWeatherData(raw = {}) {
  // raw is expected to be the top-level API response (res.data). This function
  // creates a predictable, stable shape used by UI components.
  const out = {};

  // Normalize weather block
  const w = raw.weather ?? raw.data ?? {};
  const tempCandidate = w.temp ?? w.temperature ?? (w.temp_c ?? w.temp_f) ?? null;
  const temp = typeof tempCandidate === 'number' ? tempCandidate : Number(tempCandidate) || null;
  const condition = w.condition ?? w.summary ?? w.weather?.main ?? w.weather?.description ?? (w.desc ?? null);
  const type = w.type ?? (condition ? (String(condition).toLowerCase().includes('rain') ? 'rainy' : String(condition).toLowerCase().includes('cloud') ? 'cloudy' : (String(condition).toLowerCase().includes('storm') || String(condition).toLowerCase().includes('thunder')) ? 'stormy' : 'sunny') : 'sunny');

  out.weather = {
    temp,
    condition: condition ?? 'Unknown',
    type,
    location: formatLocation(raw.location ?? w.location ?? raw.loc ?? null),
  };

  // Risk assessment
  out.riskAssessment = {
    score: raw.riskAssessment?.score ?? raw.riskScore ?? raw.risk ?? null,
    riskLevel: raw.riskAssessment?.riskLevel ?? raw.riskLevel ?? null,
  };

  // Forecast array
  out.forecast = Array.isArray(raw.forecast)
    ? raw.forecast.map((f) => ({ label: f.label ?? f.time ?? '', temp: f.temp ?? f.temp_c ?? f.t ?? null, emoji: f.emoji ?? (f.icon ?? '☀️') }))
    : [];

  // Safety suggestions
  out.safetySuggestions = raw.safetySuggestions ?? raw.suggestions ?? raw.safety ?? [];

  // Any other useful raw props
  out.raw = raw;

  return out;
}

export function normalizeEmergencyProtocol(raw = {}) {
  if (!raw) return { title: 'Unknown', overview: '', before: [], during: [], after: [], raw };
  const title = raw.title ?? raw.name ?? raw.type ?? 'Unknown Protocol';
  const overview = raw.overview ?? raw.summary ?? raw.description ?? '';
  const before = Array.isArray(raw.before) ? raw.before : (raw.stepsBefore ?? raw.preparation ?? []);
  const during = Array.isArray(raw.during) ? raw.during : (raw.stepsDuring ?? raw.action ?? []);
  const after = Array.isArray(raw.after) ? raw.after : (raw.stepsAfter ?? raw.recovery ?? []);
  return { title, overview, before, during, after, raw };
}

export function normalizeSafetyTips(raw = {}) {
  if (!raw) return { daily: [], seasonal: [], emergency: [], raw };
  const daily = Array.isArray(raw.daily) ? raw.daily : (raw.day ?? raw.dailyTips ?? []);
  const seasonal = Array.isArray(raw.seasonal) ? raw.seasonal : (raw.season ?? raw.seasonalTips ?? []);
  const emergency = Array.isArray(raw.emergency) ? raw.emergency : (raw.emergencyTips ?? raw.urgent ?? []);
  return { daily, seasonal, emergency, raw };
}
