const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

router.post('/', jobController.createJob);
router.get('/', jobController.getJobsForElectrician);
router.get('/active/householder/:householderId', jobController.getHouseholderActiveJob);
router.get('/active/electrician/:electricianId', jobController.getElectricianActiveJobs);
router.get('/history/:userId', jobController.getJobHistory);
router.get('/:jobId', jobController.getJobById);
router.post('/:jobId/accept', jobController.acceptJob);
router.post('/:jobId/status', jobController.updateJobStatus);
router.post('/:jobId/pay', jobController.submitDigitalPayment);
router.post('/:jobId/confirm-digital-payment', jobController.confirmDigitalPayment);
router.post('/:jobId/rate', jobController.rateJob);
router.post('/:jobId/cancel', jobController.cancelJob);

module.exports = router;
