const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

router.get('/status', voiceController.getVoiceModelStatus);
router.post('/intent', voiceController.predictIntent);

module.exports = router;
