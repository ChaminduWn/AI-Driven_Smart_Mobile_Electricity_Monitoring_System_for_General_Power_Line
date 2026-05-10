const express = require('express');
const router = express.Router();
const boardReportController = require('../controllers/boardReportController');

router.post('/', boardReportController.createBoardReport);
router.get('/user/:userId', boardReportController.getUserBoardReports);
router.get('/:id', boardReportController.getBoardReportById);

module.exports = router;
