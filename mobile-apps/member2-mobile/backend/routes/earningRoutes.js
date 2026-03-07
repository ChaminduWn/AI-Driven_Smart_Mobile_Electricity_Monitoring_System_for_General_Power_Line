const express = require('express');
const router = express.Router();
const earningController = require('../controllers/earningController');
// const authMiddleware = require('../middleware/auth'); // Optional: Add later when wiring up tokens

// Get Electrician Earnings (for Electrician Dashboard)
// In a real app, this should easily be protected: router.get('/', authMiddleware, earningController.getEarnings)

// Using a GET with a dynamic param for dev purposes to skip missing JWT
router.get('/:userId', (req, res, next) => {
    req.user = { id: req.params.userId };
    next();
}, earningController.getEarnings);

module.exports = router;
