const safetyLogicService = require('../services/safetyLogicService');

class SafetyController {
  getEmergencyProtocol(req, res) {
    try {
      const { disasterType } = req.params;
      if (!disasterType) {
        return res.status(400).json({ status: 'error', message: 'disasterType parameter is required. Available types: flood, thunderstorm, heavy_rain, cyclone' });
      }

      const protocol = safetyLogicService.getEmergencyProtocol(disasterType);
      if (protocol && protocol.error) return res.status(404).json({ status: 'error', message: protocol.error });

      return res.status(200).json({ status: 'success', data: protocol, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('getEmergencyProtocol error:', err.message);
      return res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
  }

  getApplianceGuidelines(req, res) {
    try {
      const { applianceType } = req.params;
      const condition = req.query.condition || 'general';
      if (!applianceType) return res.status(400).json({ status: 'error', message: 'applianceType parameter is required. Example: /appliance/refrigerator' });

      const guidelines = safetyLogicService.getApplianceGuidelines(applianceType, condition);
      if (guidelines && guidelines.error) return res.status(404).json({ status: 'error', message: guidelines.error });

      return res.status(200).json({ status: 'success', data: guidelines, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('getApplianceGuidelines error:', err.message);
      return res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
  }

  getAllEmergencyProtocols(req, res) {
    try {
      const disasters = ['flood', 'thunderstorm', 'heavy_rain', 'cyclone'];
      const protocols = {};
      for (const d of disasters) {
        const p = safetyLogicService.getEmergencyProtocol(d);
        protocols[d] = p.error ? { error: p.error } : p;
      }
      console.log('All Emergency Protocols Response:', protocols);
      return res.status(200).json({ status: 'success', data: protocols, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('getAllEmergencyProtocols error:', err.message);
      return res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
  }

  getGeneralSafetyTips(req, res) {
    try {
      const tips = {
        daily: [
          'Inspect cords and appliances for damage before use.',
          'Avoid overloading sockets; use surge protectors where appropriate.',
          'Keep electrical devices and outlets away from water sources.',
          'Turn off and unplug non-essential devices during heavy storms.',
          'Use licensed electricians for installations and repairs.'
        ],
        seasonal: [
          'Before monsoon: check roof and drainage to prevent water ingress near electrics.',
          'Install ELCBs/RCDs where possible to reduce electrocution risk.',
          'Prepare emergency lighting and battery backups.',
          'Keep a list of licensed electricians and CEB contact numbers.'
        ],
        emergency: [
          'If you smell burning, turn off mains if safe and unplug devices.',
          'Never touch a person who is being electrocuted — turn off the power first.',
          'Use a non-conductive object to separate a person from the source if you cannot turn power off.',
          'Know your breaker location and how to safely shut down the supply.'
        ]
      };

      return res.status(200).json({ status: 'success', message: 'General electrical safety tips for Sri Lankan households', data: tips, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('getGeneralSafetyTips error:', err.message);
      return res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
  }
}

module.exports = new SafetyController();
