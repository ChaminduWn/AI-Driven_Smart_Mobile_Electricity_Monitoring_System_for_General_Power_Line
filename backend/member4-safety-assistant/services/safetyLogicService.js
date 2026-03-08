const safetyRules = require('../config/safetyRules.json');

class SafetyLogicService {
  generateSafetySuggestions(weatherData, hazardAnalysis) {
    const now = new Date().toISOString();
    const immediate = [];
    const preventive = [];
    const emergency = [];

    if (!hazardAnalysis || !hazardAnalysis.hasHazards) {
      return { message: 'No immediate electrical hazards detected', timestamp: now, immediate: [], preventive: [], emergency: [] };
    }

    for (const h of hazardAnalysis.hazards) {
      const rules = this.getRulesForHazard(h.type);
      if (!rules) continue;

      (rules.immediate || []).forEach(msg => immediate.push({ priority: 'high', hazardType: h.type, message: msg, timestamp: now }));
      (rules.preventive || []).forEach(msg => preventive.push({ priority: 'medium', hazardType: h.type, message: msg, timestamp: now }));
      (rules.emergency || []).forEach(msg => emergency.push({ priority: 'urgent', hazardType: h.type, message: msg, timestamp: now }));
    }

    if (hazardAnalysis.severity && (hazardAnalysis.severity.level === 'critical' || hazardAnalysis.severity.level === 'high')) {
      immediate.unshift({ priority: 'critical', hazardType: 'general', message: 'Severe electrical hazard detected — follow emergency protocols and disconnect power where safe to do so.', timestamp: now });
    }

    return { timestamp: now, immediate, preventive, emergency };
  }

  getRulesForHazard(hazardType) {
    return safetyRules.hazardTypes && safetyRules.hazardTypes[hazardType] ? safetyRules.hazardTypes[hazardType] : null;
  }

  getEmergencyProtocol(disasterType) {
    const protocol = (safetyRules.emergencyProtocols && safetyRules.emergencyProtocols[disasterType]) || null;
    if (!protocol) return { error: `Protocol for '${disasterType}' not found` };
    return { disasterType, protocol, emergencyContacts: safetyRules.emergencyContacts || {} };
  }

  assessRiskLevel(weatherData, hazardAnalysis) {
    let score = 0;
    const factors = [];

    if (!hazardAnalysis) return { riskLevel: 'LOW', riskScore: 0, riskFactors: [], recommendation: 'No data', assessmentTime: new Date().toISOString() };

    for (const h of hazardAnalysis.hazards) {
      if (h.type === 'lightning') { score += 40; factors.push('thunderstorm'); }
      if (h.type === 'heavy_rain') { score += 30; factors.push('heavy_rain'); }
      if (h.type === 'flood_risk') { score += 35; factors.push('flood_risk'); }
      if (h.type === 'high_wind') { score += 15; factors.push('high_wind'); }
    }

    // extra checks
    if (weatherData && weatherData.conditions && weatherData.conditions.humidity > 80 && (weatherData.rain && (weatherData.rain.oneHour > 0 || weatherData.rain.threeHours > 0))) {
      score += 20; factors.push('high_humidity_with_rain');
    }

    const riskLevel = score >= 60 ? 'CRITICAL' : score >= 40 ? 'HIGH' : score >= 20 ? 'MODERATE' : 'LOW';
    let recommendation = 'Monitor conditions and follow preventive guidance.';
    if (riskLevel === 'CRITICAL') recommendation = 'Immediate action required: disconnect non-essential power, follow emergency protocols.';
    if (riskLevel === 'HIGH') recommendation = 'Take high priority precautions and prepare for possible outages.';

    return { riskLevel, riskScore: score, riskFactors: factors, recommendation, assessmentTime: new Date().toISOString() };
  }

  getApplianceGuidelines(applianceType, weatherCondition = 'general') {
    const appliance = (safetyRules.applianceGuidelines && safetyRules.applianceGuidelines[applianceType]) || null;
    if (!appliance) return { error: `Appliance guidelines for '${applianceType}' not found` };

    const guidelines = [];
    const general = appliance.general || [];
    (general || []).forEach(g => guidelines.push({ priority: appliance.priority || 'medium', message: g }));

    if (weatherCondition && weatherCondition !== 'general') {
      const specific = appliance[weatherCondition] || [];
      (specific || []).forEach(g => guidelines.push({ priority: appliance.priority || 'medium', message: g }));
    }

    return { appliance: applianceType, weatherCondition, guidelines, priority: appliance.priority || 'medium' };
  }
}

module.exports = new SafetyLogicService();
