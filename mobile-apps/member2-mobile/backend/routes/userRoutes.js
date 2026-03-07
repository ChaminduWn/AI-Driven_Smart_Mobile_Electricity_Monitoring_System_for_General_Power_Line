const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Update user profile
router.put('/:id', userController.updateProfile);

module.exports = router;
