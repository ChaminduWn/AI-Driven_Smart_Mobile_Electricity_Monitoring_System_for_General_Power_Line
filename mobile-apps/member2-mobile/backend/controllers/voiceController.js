const { predictIntent, getModelStatus } = require('../voice-intent/intentService');

exports.predictIntent = async (req, res) => {
    try {
        const {
            transcript = '',
            transcripts = [],
            topN = 5,
            allowedIntents = [],
        } = req.body || {};

        const transcriptCandidates = [
            ...new Set(
                [transcript, ...(Array.isArray(transcripts) ? transcripts : [])]
                    .map((value) => String(value || '').trim())
                    .filter(Boolean)
            ),
        ];

        if (transcriptCandidates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Transcript is required.',
            });
        }

        const result = predictIntent(
            transcriptCandidates,
            Number(topN) || 5,
            Array.isArray(allowedIntents) ? allowedIntents : []
        );

        return res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('Predict voice intent error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Could not predict voice intent.',
        });
    }
};

exports.getVoiceModelStatus = async (_req, res) => {
    try {
        return res.json({
            success: true,
            model: getModelStatus(),
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Voice intent model is not ready.',
        });
    }
};
