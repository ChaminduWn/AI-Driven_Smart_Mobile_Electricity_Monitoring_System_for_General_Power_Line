const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Using a quick dynamic user inject for missing JWTs early in dev
const mockUser = (req, res, next) => {
    // If frontend sends senderId, we will force that as the user for testing
    req.user = { id: req.body.senderId || req.query.senderId || '1' };
    next();
};

// Send a new message
router.post('/', mockUser, messageController.sendMessage);

// Get messages for a specific job
router.get('/:jobId', messageController.getMessages);

module.exports = router;
