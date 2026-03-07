const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
    try {
        const { jobId, text } = req.body;
        const senderId = req.user?.id; // Assumes auth

        if (!jobId || !text || !senderId) {
            return res.status(400).json({ success: false, message: 'Job ID, Text, and Sender ID are required' });
        }

        const message = await Message.create({
            jobId,
            senderId,
            text,
        });

        res.status(201).json({ success: true, message });
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Fetch messages for a specific Job, ordered chronologically
        const messages = await Message.findAll({
            where: { jobId },
            order: [['createdAt', 'ASC']]
        });

        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Fetch Messages Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
