import express from 'express';

const router = express.Router();

// Process voice command (placeholder - integrate with speech-to-text service)
router.post('/process', async (req, res) => {
  try {
    const { audioData, text } = req.body;

    // TODO: Integrate with speech-to-text API (Google Cloud Speech, AWS Transcribe, etc.)
    // For now, return mock response
    const commands = {
      'book a technician': 'assign-technician',
      'report power failure': 'report-outage',
      'switch language to sinhala': 'change-language'
    };

    const intent = commands[text?.toLowerCase()] || 'unknown';

    res.json({
      intent,
      text,
      confidence: 0.85
    });
  } catch (error) {
    console.error('Error processing voice command:', error);
    res.status(500).json({ error: 'Failed to process voice command' });
  }
});

export default router;