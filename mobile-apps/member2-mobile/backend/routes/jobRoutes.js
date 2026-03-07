const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
// const authMiddleware = require('../middleware/auth'); // Optional: Add later when wiring up tokens

// Create a new Job Request (from Householder)
router.post('/', jobController.createJob);

// Get available Jobs (for Electrician Dashboard)
// In a real app, this should easily be protected: router.get('/', authMiddleware, jobController.getJobsForElectrician)
router.get('/', jobController.getJobsForElectrician);

// Cancel a Job (from Householder tracking screen)
// Cancel a Job (from Householder tracking screen)
router.post('/:jobId/cancel', jobController.cancelJob);

// Get Job history for User or Electrician
router.get('/history/:userId', jobController.getJobHistory);

module.exports = router;
